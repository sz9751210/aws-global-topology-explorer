# AWS Global Topology Explorer - Data Schema

The backend `scanner.py` produces a JSON array, where each item represents a Region.

## Root Object (Array of Regions)

```json
[
  {
    "region": "us-east-1",
    "vpcs": [ ... ]
  },
  ...
]
```

## VPC Object

```json
{
  "id": "vpc-0123456789abcdef0",
  "name": "production-vpc",
  "cidr": "10.0.0.0/16",
  "subnets": [ ... ]
}
```

## Subnet Object

```json
{
  "id": "subnet-0abcdef1234567890",
  "name": "public-subnet-1a",
  "cidr": "10.0.1.0/24",
  "az": "us-east-1a",
  "instances": [ ... ]
}
```

## Instance Object

```json
{
  "id": "i-0123456789abcdef0",
  "name": "web-server-01",
  "type": "t3.micro",
  "state": "running",
  "private_ip": "10.0.1.5",
  "public_ip": "54.1.2.3", // Optional
  "security_rules": [ ... ]
}
```

## Security Rule Object (Resolved)

```json
{
  "protocol": "tcp",
  "from_port": 80,
  "to_port": 80,
  "source": [
    "0.0.0.0/0",
    "sg-987654321 (alb-sg)" 
  ],
  "description": "TCP 80 from 0.0.0.0/0",
  "sg_id": "sg-123456789",
  "sg_name": "web-sg"
}
```

## Typescript Interface (Frontend)

```typescript
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
```
