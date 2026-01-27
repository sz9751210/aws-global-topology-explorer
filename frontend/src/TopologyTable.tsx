import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    ColumnDef,
    flexRender,
    Row,
    HeaderGroup,
    Header,
    Cell,
    ExpandedState,
} from '@tanstack/react-table';
import { RegionData, Instance, Subnet, SecurityRule, VPC } from './types';
import { DetailPanel } from './DetailPanel';
import { ChevronRight, ChevronDown, Server, Box, Layers, MapPin, Search, Shield, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { ResourceType } from './Sidebar';

// Extended Instance type for flat EC2 view with additional context
interface FlatInstance extends Instance {
    az: string;
    vpc_name: string;
    vpc_id: string;
    subnet_name: string;
    region: string;
}

interface Props {
    data: RegionData[];
    loading?: boolean;
    resourceFilter?: ResourceType;
}

// Status indicator component
const StatusIndicator: React.FC<{ state: string }> = ({ state }) => {
    const isRunning = state === 'running';
    return (
        <div className="flex items-center gap-2">
            <span className={clsx(
                "w-2 h-2 rounded-full",
                isRunning ? "bg-green-500" : "bg-gray-400"
            )}></span>
        </div>
    );
};

export const TopologyTable: React.FC<Props> = ({ data, loading, resourceFilter = 'all' }) => {
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

    // Flatten all EC2 instances across all regions for the flat EC2 view
    const flatEc2Data = useMemo((): FlatInstance[] => {
        if (resourceFilter !== 'ec2') return [];

        const instances: FlatInstance[] = [];
        data.forEach((region) => {
            region.vpcs.forEach((vpc) => {
                vpc.subnets.forEach((subnet) => {
                    subnet.instances.forEach((inst) => {
                        instances.push({
                            ...inst,
                            az: subnet.az,
                            vpc_name: vpc.name,
                            vpc_id: vpc.id,
                            subnet_name: subnet.name,
                            region: region.region,
                        });
                    });
                });
            });
        });
        return instances;
    }, [data, resourceFilter]);

    // Transform raw data into a tree structure compatible with our specific Node type
    // resourceFilter is passed for future filtering logic
    const treeData = useMemo(() => {
        // For EC2 filter, we use flatEc2Data instead
        if (resourceFilter === 'ec2') return [];

        return data.map((region) => {
            // Filter Logic:
            // - If filter is 'vpc', we only want vpcs.
            // - If filter is 'subnet', we want vpcs -> subnets.
            // - If filter is 'sg', we want full depth.
            // - If filter is 'all', full depth.

            const vpcs = region.vpcs.map((vpc) => {
                // For 'vpc' filter, we don't need subnets
                if (resourceFilter === 'vpc') {
                    return {
                        kind: 'vpc' as const,
                        data: vpc,
                        region: region.region,
                        subRows: [],
                    };
                }

                const subnets = vpc.subnets.map((subnet) => {
                    // For 'subnet' filter, we don't need instances
                    if (resourceFilter === 'subnet') {
                        return {
                            kind: 'subnet' as const,
                            data: subnet,
                            region: region.region,
                            subRows: [],
                        };
                    }

                    // For 'sg' filter, we want to flatten resources under VPC, so skip subnets here
                    if (resourceFilter === 'sg') {
                        return null;
                    }

                    // For 'all', we include instances nested in subnets
                    return {
                        kind: 'subnet' as const,
                        data: subnet,
                        region: region.region,
                        subRows: subnet.instances.map((inst) => ({
                            kind: 'instance' as const,
                            data: inst,
                            region: region.region,
                            subRows: [], // Leaf
                        })),
                    };
                }).filter(Boolean) as Array<{ kind: string; data: unknown; region: string; subRows: unknown[] }>; // Filter nulls from SG logic

                // Special handling for 'sg' filter to aggregate resources from all subnets
                let vpcSubRows = subnets;
                if (resourceFilter === 'sg') {
                    const sgMap = new Map<string, { id: string; name: string }>();
                    vpc.subnets.forEach((subnet: Subnet) => {
                        subnet.instances.forEach((inst: Instance) => {
                            inst.security_rules.forEach((rule: SecurityRule) => {
                                if (rule.sg_id && !sgMap.has(rule.sg_id)) {
                                    sgMap.set(rule.sg_id, { id: rule.sg_id, name: rule.sg_name });
                                }
                            });
                        });
                    });

                    vpcSubRows = Array.from(sgMap.values()).map(sg => ({
                        kind: 'security_group' as const,
                        data: sg,
                        region: region.region,
                        subRows: [],
                    }));
                }

                // Filter out empty VPCs for SG views to keep the interface clean
                if (resourceFilter === 'sg' && vpcSubRows.length === 0) {
                    return null;
                }

                return {
                    kind: 'vpc' as const,
                    data: vpc,
                    region: region.region,
                    subRows: vpcSubRows,
                };
            }).filter(Boolean) as Array<{ kind: string; data: VPC; region: string; subRows: unknown[] }>;

            // Filter out empty Regions for SG views
            if (resourceFilter === 'sg' && vpcs.length === 0) {
                return null;
            }

            return {
                kind: 'region' as const,
                data: region,
                subRows: vpcs,
            };
        }).filter(Boolean) as Array<{ kind: string; data: unknown; subRows: unknown[] }>; // Top-level filter to remove null regions
    }, [data, resourceFilter]);

    // Auto-expansion effect
    React.useEffect(() => {
        if (resourceFilter === 'all') {
            setExpanded({});
        } else if (resourceFilter !== 'ec2') {
            // For vpc, subnet, sg - expand all
            setExpanded(true);
        }
    }, [resourceFilter]);

    // Columns for the flat EC2 table (GCP-style)
    const ec2Columns = useMemo<ColumnDef<FlatInstance>[]>(
        () => [
            {
                id: 'status',
                header: '',
                size: 40,
                cell: ({ row }) => <StatusIndicator state={row.original.state} />,
            },
            {
                accessorKey: 'name',
                header: 'NAME',
                cell: ({ row }) => (
                    <button
                        className="text-left w-full group hover:text-indigo-700"
                        onClick={() => setSelectedInstance(row.original)}
                    >
                        <span className="font-medium text-slate-800 group-hover:text-indigo-700">
                            {row.original.name || row.original.id}
                        </span>
                    </button>
                ),
            },
            {
                accessorKey: 'az',
                header: 'ZONE',
                cell: ({ row }) => (
                    <span className="text-slate-600 text-sm">{row.original.az || '-'}</span>
                ),
            },
            {
                accessorKey: 'type',
                header: 'TYPE',
                cell: ({ row }) => (
                    <span className="text-slate-600 text-sm font-mono">{row.original.type || '-'}</span>
                ),
            },
            {
                accessorKey: 'private_ip',
                header: 'INTERNAL IP',
                cell: ({ row }) => (
                    <span className="text-slate-600 text-sm font-mono">{row.original.private_ip || '-'}</span>
                ),
            },
            {
                accessorKey: 'public_ip',
                header: 'EXTERNAL IP',
                cell: ({ row }) => (
                    <span className="text-cyan-600 text-sm font-mono">{row.original.public_ip || '-'}</span>
                ),
            },
            {
                accessorKey: 'vpc_name',
                header: 'NETWORK',
                cell: ({ row }) => (
                    <span className="text-cyan-600 text-sm">{row.original.vpc_name || '-'}</span>
                ),
            },
            {
                id: 'connect',
                header: 'CONNECT',
                cell: ({ row }) => (
                    <button
                        className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        onClick={() => {
                            // Copy SSH command to clipboard
                            const ip = row.original.public_ip || row.original.private_ip;
                            if (ip) {
                                navigator.clipboard.writeText(`ssh ec2-user@${ip}`);
                            }
                        }}
                    >
                        <Terminal size={14} className="text-slate-500" />
                        SSH
                    </button>
                ),
            },
        ],
        []
    );

    // Columns for the tree-based hierarchical view
    const treeColumns = useMemo<ColumnDef<{ kind: string; data: unknown; region?: string; subRows?: unknown[] }>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Resource Hierarchy',
                cell: ({ row }) => {
                    const node = row.original as { kind: string; data: { [key: string]: unknown }; region?: string };
                    let content = null;
                    let icon = null;
                    let style = "";

                    if (node.kind === 'region') {
                        const regionData = node.data as unknown as RegionData;
                        content = <span className="font-bold text-slate-800">{regionData.region}</span>;
                        icon = <MapPin size={16} className="text-slate-400" />;
                        style = "bg-slate-50 border-l-4 border-slate-300";
                    } else if (node.kind === 'vpc') {
                        const vpcData = node.data as unknown as VPC;
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium text-slate-700">{vpcData.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{vpcData.id}</span>
                            </div>
                        );
                        icon = <Box size={16} className="text-indigo-400" />;
                        style = "pl-8 border-l border-slate-100 hover:bg-slate-50";
                    } else if (node.kind === 'subnet') {
                        const subnetData = node.data as unknown as Subnet;
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="text-slate-600 text-sm">{subnetData.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{subnetData.az}</span>
                            </div>
                        );
                        icon = <Layers size={14} className="text-cyan-500" />;
                        style = "pl-14 border-l border-slate-100 hover:bg-slate-50";
                    } else if (node.kind === 'instance') {
                        const instanceData = node.data as unknown as Instance;
                        content = (
                            <button
                                className="text-left w-full group"
                                onClick={() => setSelectedInstance(instanceData)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-medium text-sm text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                            {instanceData.name || 'Unnamed Instance'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{instanceData.id}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        );
                        icon = <Server size={14} className={instanceData.state === 'running' ? "text-emerald-500" : "text-slate-400"} />;
                        style = "pl-20 border-l border-slate-100 hover:bg-indigo-50 cursor-pointer transition-colors";
                    } else if (node.kind === 'security_group') {
                        const sgData = node.data as { id: string; name: string };
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium text-slate-700">{sgData.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{sgData.id}</span>
                            </div>
                        );
                        icon = <Shield size={14} className="text-orange-500" />;
                        style = "pl-14 border-l border-slate-100 hover:bg-slate-50";
                    }

                    return (
                        <div className={`flex items-center gap-3 py-2 px-4 h-full ${style}`}>
                            {row.getCanExpand() ? (
                                <button
                                    onClick={row.getToggleExpandedHandler()}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors focus:outline-none"
                                >
                                    {row.getIsExpanded() ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <span className="w-6" /> // Spacer
                            )}
                            {icon}
                            <div className="flex-1">{content}</div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'details',
                header: 'Network & Status',
                cell: ({ row }) => {
                    const node = row.original as { kind: string; data: { [key: string]: unknown } };
                    if (node.kind === 'vpc') {
                        const vpcData = node.data as unknown as VPC;
                        return <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{vpcData.cidr}</span>;
                    }
                    if (node.kind === 'subnet') {
                        const subnetData = node.data as unknown as Subnet;
                        return <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{subnetData.cidr}</span>;
                    }
                    if (node.kind === 'instance') {
                        const instanceData = node.data as unknown as Instance;
                        return (
                            <div className="flex gap-2 text-xs items-center">
                                <span
                                    className={clsx(
                                        "px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5",
                                        instanceData.state === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    )}
                                >
                                    <span className={clsx("w-1.5 h-1.5 rounded-full", instanceData.state === 'running' ? 'bg-emerald-500' : 'bg-slate-400')}></span>
                                    {instanceData.state}
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-mono">{instanceData.type}</span>
                                <span className="text-slate-500 font-mono">{instanceData.private_ip}</span>
                            </div>
                        );
                    }
                    return null;
                },
            },
        ],
        []
    );

    // EC2 flat table
    const ec2Table = useReactTable({
        data: flatEc2Data,
        columns: ec2Columns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Tree table
    const treeTable = useReactTable({
        data: treeData,
        columns: treeColumns as ColumnDef<{ kind: string; data: unknown; subRows?: unknown[] }>[],
        state: {
            expanded,
        },
        onExpandedChange: setExpanded,
        getSubRows: (row) => row.subRows as Array<{ kind: string; data: unknown; subRows?: unknown[] }>,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    // Use the appropriate table based on filter
    const isEc2View = resourceFilter === 'ec2';

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-white">
            {/* Main Table Area */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
                {/* Search Bar (Visual Only for now) */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <Search size={16} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter logic to be implemented..."
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-slate-400 text-slate-600"
                        disabled
                    />
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    {isEc2View ? (
                        /* EC2 Flat Table */
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                {ec2Table.getHeaderGroups().map((headerGroup: HeaderGroup<FlatInstance>) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header: Header<FlatInstance, unknown>) => (
                                            <th
                                                key={header.id}
                                                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {ec2Table.getRowModel().rows.map((row: Row<FlatInstance>) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                        {row.getVisibleCells().map((cell: Cell<FlatInstance, unknown>) => (
                                            <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* Tree Table */
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                {treeTable.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                                                style={{ width: header.id === 'name' ? '60%' : '40%' }}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {treeTable.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-0 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {((isEc2View && flatEc2Data.length === 0) || (!isEc2View && treeData.length === 0)) && !loading && (
                        <div className="p-10 text-center text-slate-400 italic">No data available. Please sync.</div>
                    )}
                </div>
            </div>

            {/* Side Panel (Overlay or Split) */}
            <div
                className={clsx(
                    "transition-all duration-300 ease-in-out bg-white shadow-xl z-20 overflow-hidden border-l border-slate-200 flex flex-col",
                    selectedInstance ? "w-[400px] translate-x-0 opacity-100" : "w-0 translate-x-full opacity-0"
                )}
            >
                {selectedInstance && (
                    <div className="h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700">Instance Details</h3>
                            <button
                                onClick={() => setSelectedInstance(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <DetailPanel instance={selectedInstance} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
