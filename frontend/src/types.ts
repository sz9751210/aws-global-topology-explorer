export interface SecurityRule {
    protocol: string;
    from_port: number;
    to_port: number;
    source: string[];
    description: string;
    sg_id: string;
    sg_name: string;
}

export interface Instance {
    id: string;
    name: string;
    type: string;
    state: string;
    private_ip: string;
    public_ip?: string;
    subnet_id?: string;
    security_rules: SecurityRule[];
}

export interface Subnet {
    id: string;
    name: string;
    cidr: string;
    az: string;
    instances: Instance[];
}

export interface VPC {
    id: string;
    name: string;
    cidr: string;
    subnets: Subnet[];
}

export interface RegionData {
    region: string;
    vpcs: VPC[];
    error?: string;
}

// Union type for the Tree Table row
export type TopologyNode =
    | { kind: 'region'; data: RegionData }
    | { kind: 'vpc'; data: VPC; region: string }
    | { kind: 'subnet'; data: Subnet; region: string }
    | { kind: 'instance'; data: Instance; region: string }
    | { kind: 'security_group'; data: { id: string; name: string }; region: string };
