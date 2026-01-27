import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    ColumnDef,
    flexRender,
    Row,
} from '@tanstack/react-table';
import { RegionData, TopologyNode, Instance } from './types';
import { DetailPanel } from './DetailPanel';

// --- Icons ---
const ChevronRight = () => <span className="mr-2">▶</span>;
const ChevronDown = () => <span className="mr-2">▼</span>;

interface Props {
    data: RegionData[];
}

export const TopologyTable: React.FC<Props> = ({ data }) => {
    const [expanded, setExpanded] = useState({});
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

    // Transform raw data into a tree structure compatible with our specific Node type
    const treeData = useMemo(() => {
        return data.map((region) => ({
            kind: 'region' as const,
            data: region,
            subRows: region.vpcs.map((vpc) => ({
                kind: 'vpc' as const,
                data: vpc,
                region: region.region,
                subRows: vpc.subnets.map((subnet) => ({
                    kind: 'subnet' as const,
                    data: subnet,
                    region: region.region,
                    subRows: subnet.instances.map((inst) => ({
                        kind: 'instance' as const,
                        data: inst,
                        region: region.region,
                        subRows: [], // Leaf
                    })),
                })),
            })),
        }));
    }, [data]);

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Resource Name / ID',
                cell: ({ row }) => {
                    const node = row.original;

                    let content = null;
                    let icon = null;
                    let style = "";

                    if (node.kind === 'region') {
                        content = <span className="font-bold text-lg">{node.data.region}</span>;
                        style = "bg-gray-100";
                    } else if (node.kind === 'vpc') {
                        content = <span>🌐 VPC: {node.data.name} <span className="text-gray-500 text-sm">({node.data.id})</span></span>;
                        style = "pl-4";
                    } else if (node.kind === 'subnet') {
                        content = <span>🕸️ Subnet: {node.data.name} <span className="text-gray-500 text-sm">({node.data.az})</span></span>;
                        style = "pl-8 text-sm";
                    } else if (node.kind === 'instance') {
                        content = (
                            <span
                                className="cursor-pointer text-blue-600 hover:underline flex items-center"
                                onClick={() => setSelectedInstance(node.data)}
                            >
                                🖥️ {node.data.name} <span className="text-gray-500 text-xs ml-2">({node.data.id})</span>
                            </span>
                        );
                        style = "pl-12 text-sm";
                    }

                    return (
                        <div className={`flex items-center ${style}`}>
                            {row.getCanExpand() && (
                                <button
                                    onClick={row.getToggleExpandedHandler()}
                                    className="cursor-pointer w-6 h-6 flex items-center justify-center focus:outline-none"
                                >
                                    {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
                                </button>
                            )}
                            {!row.getCanExpand() && <span className="w-6" />}
                            {content}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'details',
                header: 'Details',
                cell: ({ row }) => {
                    const node = row.original;
                    if (node.kind === 'vpc') return <span className="text-gray-600">{node.data.cidr}</span>;
                    if (node.kind === 'subnet') return <span className="text-gray-600">{node.data.cidr}</span>;
                    if (node.kind === 'instance') {
                        return (
                            <div className="flex gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded text-white ${node.data.state === 'running' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                    {node.data.state}
                                </span>
                                <span className="bg-blue-100 px-2 py-0.5 rounded border border-blue-200">{node.data.type}</span>
                                <span className="text-gray-500">{node.data.private_ip}</span>
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
        <div className="flex h-screen bg-white">
            {/* Main Table Area */}
            <div className="flex-1 overflow-auto p-4 border-r border-gray-200">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">AWS Global Topology Explorer</h1>
                <div className="shadow border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-2 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Panel */}
            <div className={`transition-all duration-300 ${selectedInstance ? 'w-1/3' : 'w-0'} overflow-hidden border-l border-gray-200 bg-gray-50`}>
                {selectedInstance && (
                    <div className="p-4 h-full overflow-auto">
                        <button
                            onClick={() => setSelectedInstance(null)}
                            className="mb-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕ Close
                        </button>
                        <DetailPanel instance={selectedInstance} />
                    </div>
                )}
            </div>
        </div>
    );
};
