import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import { RegionData, Instance, Subnet, SecurityRule } from './types';
import { DetailPanel } from './DetailPanel';
import { ChevronRight, ChevronDown, Server, Box, Layers, MapPin, Search, Shield } from 'lucide-react';
import clsx from 'clsx';
import { ResourceType } from './Sidebar';

interface Props {
    data: RegionData[];
    loading?: boolean;
    resourceFilter?: ResourceType;
}

export const TopologyTable: React.FC<Props> = ({ data, loading, resourceFilter = 'all' }) => {
    const [expanded, setExpanded] = useState({});
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);


    // Transform raw data into a tree structure compatible with our specific Node type
    // Transform raw data into a tree structure compatible with our specific Node type
    // resourceFilter is passed for future filtering logic
    const treeData = useMemo(() => {
        return data.map((region) => {
            // Filter Logic:
            // - If filter is 'vpc', we only want vpcs.
            // - If filter is 'subnet', we want vpcs -> subnets.
            // - If filter is 'ec2' or 'sg', we want full depth.
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

                    // For 'sg' or 'ec2' filter, we want to flatten resources under VPC, so skip subnets here
                    if (resourceFilter === 'sg' || resourceFilter === 'ec2') {
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
                }).filter(Boolean) as any[]; // Filter nulls from SG/EC2 logic

                // Special handling for 'sg' and 'ec2' filter to aggregate resources from all subnets
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
                } else if (resourceFilter === 'ec2') {
                    const allInstances: Instance[] = [];
                    vpc.subnets.forEach((subnet: Subnet) => {
                        allInstances.push(...subnet.instances);
                    });

                    vpcSubRows = allInstances.map(inst => ({
                        kind: 'instance' as const,
                        data: inst,
                        region: region.region,
                        subRows: [],
                    }));
                }

                // Filter out empty VPCs for EC2 and SG views to keep the interface clean
                if ((resourceFilter === 'ec2' || resourceFilter === 'sg') && vpcSubRows.length === 0) {
                    return null;
                }

                return {
                    kind: 'vpc' as const,
                    data: vpc,
                    region: region.region,
                    subRows: vpcSubRows,
                };
            }).filter(Boolean) as any[];

            // Filter out empty Regions for EC2/SG views
            if ((resourceFilter === 'ec2' || resourceFilter === 'sg') && vpcs.length === 0) {
                return null;
            }

            return {
                kind: 'region' as const,
                data: region,
                subRows: vpcs,
            };
        }).filter(Boolean) as any[]; // Top-level filter to remove null regions
    }, [data, resourceFilter]);

    // Auto-expansion effect
    React.useEffect(() => {
        if (resourceFilter === 'all') {
            // By default, maybe just expand regions? or nothing.
            // setExpanded({}); 
        } else if (resourceFilter === 'vpc') {
            // Expand regions to show VPCs
            setExpanded({ true: true }); // This might be too aggressive if valid syntax, usually keys are row IDs. 
            // Since we don't have row IDs easily here before table creation, we might rely on the table state or default expanded.
            // Actually, react-table uses row values.
            // Let's rely on user interaction for 'vpc' and 'subnet' roughly, OR expandable 'true' for all.
            setExpanded(true); // Expand all rows
        } else if (resourceFilter === 'subnet') {
            setExpanded(true);
        } else if (resourceFilter === 'ec2' || resourceFilter === 'sg') {
            setExpanded(true);
        } else {
            setExpanded({});
        }
    }, [resourceFilter]);

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Resource Hierarchy',
                cell: ({ row }) => {
                    const node = row.original;
                    let content = null;
                    let icon = null;
                    let style = "";

                    if (node.kind === 'region') {
                        content = <span className="font-bold text-slate-800">{node.data.region}</span>;
                        icon = <MapPin size={16} className="text-slate-400" />;
                        style = "bg-slate-50 border-l-4 border-slate-300";
                    } else if (node.kind === 'vpc') {
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium text-slate-700">{node.data.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{node.data.id}</span>
                            </div>
                        );
                        icon = <Box size={16} className="text-indigo-400" />;
                        style = "pl-8 border-l border-slate-100 hover:bg-slate-50";
                    } else if (node.kind === 'subnet') {
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="text-slate-600 text-sm">{node.data.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{node.data.az}</span>
                            </div>
                        );
                        icon = <Layers size={14} className="text-cyan-500" />;
                        style = "pl-14 border-l border-slate-100 hover:bg-slate-50";
                    } else if (node.kind === 'instance') {
                        content = (
                            <button
                                className="text-left w-full group"
                                onClick={() => setSelectedInstance(node.data)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-medium text-sm text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                            {node.data.name || 'Unnamed Instance'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{node.data.id}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        );
                        icon = <Server size={14} className={node.data.state === 'running' ? "text-emerald-500" : "text-slate-400"} />;
                        style = "pl-20 border-l border-slate-100 hover:bg-indigo-50 cursor-pointer transition-colors";
                    } else if (node.kind === 'security_group') {
                        content = (
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium text-slate-700">{node.data.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{node.data.id}</span>
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
                    const node = row.original;
                    if (node.kind === 'vpc') return <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{node.data.cidr}</span>;
                    if (node.kind === 'subnet') return <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{node.data.cidr}</span>;
                    if (node.kind === 'instance') {
                        return (
                            <div className="flex gap-2 text-xs items-center">
                                <span
                                    className={clsx(
                                        "px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5",
                                        node.data.state === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    )}
                                >
                                    <span className={clsx("w-1.5 h-1.5 rounded-full", node.data.state === 'running' ? 'bg-emerald-500' : 'bg-slate-400')}></span>
                                    {node.data.state}
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-mono">{node.data.type}</span>
                                <span className="text-slate-500 font-mono">{node.data.private_ip}</span>
                            </div>
                        );
                    }
                    return null;
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: treeData,
        columns,
        state: {
            expanded,
        },
        onExpandedChange: setExpanded,
        getSubRows: (row: any) => row.subRows,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

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
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            {table.getHeaderGroups().map((headerGroup) => (
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
                            {table.getRowModel().rows.map((row) => (
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

                    {treeData.length === 0 && !loading && (
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
