import pytest
from unittest.mock import MagicMock, patch
from app.services.scanner import get_enabled_regions, scan_region

@pytest.fixture
def mock_boto3():
    with patch('app.services.scanner.boto3') as mock:
        yield mock

def test_get_enabled_regions(mock_boto3):
    mock_client = MagicMock()
    mock_boto3.client.return_value = mock_client
    mock_client.describe_regions.return_value = {
        'Regions': [{'RegionName': 'us-east-1'}, {'RegionName': 'eu-west-1'}]
    }

    regions = get_enabled_regions()
    assert len(regions) == 2
    assert 'us-east-1' in regions

def test_scan_region_success(mock_boto3):
    mock_session = MagicMock()
    mock_ec2 = MagicMock()
    mock_boto3.Session.return_value = mock_session
    mock_session.client.return_value = mock_ec2
    
    # Mock EC2 responses
    mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}
    mock_ec2.describe_vpcs.return_value = {'Vpcs': [{'VpcId': 'vpc-123', 'CidrBlock': '10.0.0.0/16'}]}
    mock_ec2.describe_subnets.return_value = {'Subnets': []}
    mock_ec2.describe_instances.return_value = {'Reservations': []}

    result = scan_region('us-east-1')
    
    assert result['region'] == 'us-east-1'
    assert len(result['vpcs']) == 1
    assert result['vpcs'][0]['id'] == 'vpc-123'
