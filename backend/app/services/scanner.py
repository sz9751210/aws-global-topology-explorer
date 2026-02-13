import boto3
import concurrent.futures
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

def get_enabled_regions():
    """Fetches all opted-in regions."""
    # Use a default region to list regions. us-east-1 is standard for this.
    ec2 = boto3.client('ec2', region_name='us-east-1')
    try:
        response = ec2.describe_regions(Filters=[{'Name': 'opt-in-status', 'Values': ['opt-in-not-required', 'opted-in']}])
        return [r['RegionName'] for r in response['Regions']]
    except ClientError as e:
        logger.error(f"Error fetching regions: {e}")
        return []

def format_security_rule(rule):
    """Formats a single security group rule into a human-readable string."""
    protocol = rule.get('IpProtocol', 'All')
    if protocol == '-1': protocol = 'All Traffic'
    
    from_port = rule.get('FromPort', 'All')
    to_port = rule.get('ToPort', 'All')
    port_range = f"{from_port}-{to_port}" if from_port != to_port else f"{from_port}"
    if from_port == 'All': port_range = 'All'
    
    sources = []
    for ip_range in rule.get('IpRanges', []):
        sources.append(ip_range.get('CidrIp'))
    for ipv6_range in rule.get('Ipv6Ranges', []):
        sources.append(ipv6_range.get('CidrIpv6'))
    for user_group in rule.get('UserIdGroupPairs', []):
        group_id = user_group.get('GroupId')
        # Ideally, we would look up the group name here if we had a global map, 
        # but locally we can just show ID. The caller might enrich this.
        sources.append(group_id)
        
    source_str = ", ".join(sources) if sources else "0.0.0.0/0 (implied)"
    
    return f"{protocol.upper()} {port_range} from {source_str}"

def scan_region(region):
    """Scans a single region for VPCs, Subnets, EC2s, and SGs."""
    logger.info(f"Scanning region: {region}...")
    try:
        session = boto3.Session(region_name=region)
        ec2 = session.client('ec2')
    except Exception as e:
        logger.error(f"Failed to create session for {region}: {e}")
        return {'region': region, 'error': str(e), 'vpcs': []}
    
    try:
        # 1. Fetch all Security Groups first
        sgs = ec2.describe_security_groups()['SecurityGroups']
        sg_map = {sg['GroupId']: sg for sg in sgs} # Quick lookup by ID
        
        # Helper to get SG Name
        def get_sg_name_or_id(sg_id):
            return sg_map.get(sg_id, {}).get('GroupName', sg_id)

        # 2. Fetch VPCs
        vpcs = ec2.describe_vpcs()['Vpcs']
        
        # 3. Fetch Subnets
        subnets = ec2.describe_subnets()['Subnets']
        
        # 4. Fetch Instances
        instances = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['running', 'stopped', 'pending', 'stopping']} # Ignore terminated
        ])
        
        all_instances = []
        for reservation in instances['Reservations']:
            all_instances.extend(reservation['Instances'])
            
        # --- Aggregation Logic ---
        
        # Structure: Region -> VPC -> Subnet -> Instances
        
        vpc_dict = {}
        for vpc in vpcs:
            vpc_id = vpc['VpcId']
            vpc_name = next((t['Value'] for t in vpc.get('Tags', []) if t['Key'] == 'Name'), vpc_id)
            vpc_dict[vpc_id] = {
                'id': vpc_id,
                'name': vpc_name,
                'cidr': vpc['CidrBlock'],
                'subnets': {} 
            }
            
        # Add Subnets to VPCs
        subnet_lookup = {} # To easily find where to put instances
        for subnet in subnets:
            vpc_id = subnet['VpcId']
            if vpc_id not in vpc_dict: continue # Should not happen usually
            
            subnet_id = subnet['SubnetId']
            subnet_name = next((t['Value'] for t in subnet.get('Tags', []) if t['Key'] == 'Name'), subnet_id)
            
            s_obj = {
                'id': subnet_id,
                'name': subnet_name,
                'cidr': subnet['CidrBlock'],
                'az': subnet['AvailabilityZone'],
                'instances': []
            }
            vpc_dict[vpc_id]['subnets'][subnet_id] = s_obj
            subnet_lookup[subnet_id] = s_obj

        # Process Instances
        for instance in all_instances:
            subnet_id = instance.get('SubnetId')
            if not subnet_id or subnet_id not in subnet_lookup:
                # Instance might be in a VPC but we missed the subnet or classic EC2?
                # Just skipping for simplicity of the Tree, or handle 'Orphan'
                continue
            
            instance_id = instance['InstanceId']
            instance_name = next((t['Value'] for t in instance.get('Tags', []) if t['Key'] == 'Name'), instance_id)
            
            # Resolve Security Groups
            attached_sgs = instance.get('SecurityGroups', [])
            resolved_rules = []
            
            for sg_meta in attached_sgs:
                sg_id = sg_meta['GroupId']
                sg_details = sg_map.get(sg_id)
                if not sg_details: continue
                
                # Inbound Rules
                for perm in sg_details.get('IpPermissions', []):
                    # Enrich rule with readable Source SG Name if possible
                    enriched_perm = perm.copy()
                    if 'UserIdGroupPairs' in enriched_perm:
                        for pair in enriched_perm['UserIdGroupPairs']:
                            src_sg_id = pair.get('GroupId')
                            pair['GroupName'] = get_sg_name_or_id(src_sg_id)
                            
                    readable_rule = format_security_rule(enriched_perm)
                    resolved_rules.append({
                        'protocol': perm.get('IpProtocol'),
                        'from_port': perm.get('FromPort'),
                        'to_port': perm.get('ToPort'),
                        'source': [range.get('CidrIp') for range in perm.get('IpRanges', [])] + 
                                  [pair.get('GroupId') + f" ({pair.get('GroupName')})" for pair in enriched_perm.get('UserIdGroupPairs', [])],
                        'description': readable_rule,
                        'sg_id': sg_id,
                        'sg_name': sg_meta['GroupName']
                    })

            instance_obj = {
                'id': instance_id,
                'name': instance_name,
                'type': instance['InstanceType'],
                'state': instance['State']['Name'],
                'private_ip': instance.get('PrivateIpAddress'),
                'public_ip': instance.get('PublicIpAddress'),
                'security_rules': resolved_rules
            }
            
            subnet_lookup[subnet_id]['instances'].append(instance_obj)

        # Convert Dicts to Lists for JSON
        final_vpcs = []
        for vpc in vpc_dict.values():
            vpc['subnets'] = list(vpc['subnets'].values())
            final_vpcs.append(vpc)
            
        return {
            'region': region,
            'vpcs': final_vpcs
        }

    except Exception as e:
        logger.error(f"Error scanning {region}: {e}")
        return {'region': region, 'error': str(e), 'vpcs': []}
