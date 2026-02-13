import React, { useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RegionData } from './types';
import { Server, Box, Layers, MapPin } from 'lucide-react';

interface TopologyMapProps {
    data: RegionData[];
}

const LAYOUT_CONFIG = {
    region: { width: 1000, padding: 50, headerHeight: 60 },
    vpc: { width: 900, padding: 40, headerHeight: 50 },
    subnet: { width: 800, padding: 30, headerHeight: 40 },
    instance: { width: 180, height: 60, gap: 20 },
};

export const TopologyMap: React.FC<TopologyMapProps> = ({ data }) => {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        let regionY = 0;

        data.forEach((region) => {
            const regionId = `region-${region.region}`;
            let vpcY = LAYOUT_CONFIG.region.headerHeight;

            // VPCs
            region.vpcs.forEach((vpc) => {
                const vpcId = `vpc-${vpc.id}`;
                let subnetY = LAYOUT_CONFIG.vpc.headerHeight;

                // Subnets
                vpc.subnets.forEach((subnet) => {
                    const subnetId = `subnet-${subnet.id}`;

                    // Instances
                    const instanceNodes: Node[] = [];
                    subnet.instances.forEach((inst, iIdx) => {
                        const instanceId = `inst-${inst.id}`;
                        instanceNodes.push({
                            id: instanceId,
                            type: 'default', // Standard node for now
                            data: {
                                label: (
                                    <div className="flex items-center gap-2 p-1">
                                        <Server size={14} className={inst.state === 'running' ? "text-emerald-500" : "text-slate-400"} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 truncate w-24">{inst.name || inst.id}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{inst.private_ip}</span>
                                        </div>
                                    </div>
                                )
                            },
                            position: {
                                x: LAYOUT_CONFIG.subnet.padding + (iIdx % 3) * (LAYOUT_CONFIG.instance.width + LAYOUT_CONFIG.instance.gap),
                                y: LAYOUT_CONFIG.subnet.headerHeight + Math.floor(iIdx / 3) * (LAYOUT_CONFIG.instance.height + LAYOUT_CONFIG.instance.gap)
                            },
                            parentNode: subnetId,
                            extent: 'parent',
                            style: { width: LAYOUT_CONFIG.instance.width, height: LAYOUT_CONFIG.instance.height, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }
                        });
                    });

                    // Subnet Node Content
                    const subnetHeight = Math.max(
                        100,
                        LAYOUT_CONFIG.subnet.headerHeight +
                        Math.ceil(instanceNodes.length / 3) * (LAYOUT_CONFIG.instance.height + LAYOUT_CONFIG.instance.gap) +
                        LAYOUT_CONFIG.subnet.padding
                    );

                    nodes.push({
                        id: subnetId,
                        type: 'group',
                        data: { label: null }, // Custom rendering handled directly via style/children usually, but using default Group for now
                        position: { x: LAYOUT_CONFIG.vpc.padding, y: subnetY },
                        style: {
                            width: LAYOUT_CONFIG.subnet.width,
                            height: subnetHeight,
                            backgroundColor: 'rgba(6, 182, 212, 0.05)',
                            border: '1px dashed #06b6d4',
                            borderRadius: '8px',
                        },
                        parentNode: vpcId,
                    });
                    // Label node for Subnet since group nodes don't render complex labels easily
                    nodes.push({
                        id: `${subnetId}-label`,
                        type: 'input',
                        data: { label: <div className="flex items-center gap-2 text-cyan-700 font-bold"><Layers size={14} /> {subnet.name} ({subnet.cidr})</div> },
                        position: { x: 10, y: -15 }, // Overlap top border
                        parentNode: subnetId,
                        style: { background: 'transparent', border: 'none', width: 'auto' },
                        draggable: false,
                        connectable: false,
                    });

                    nodes.push(...instanceNodes);
                    subnetY += subnetHeight + 20;
                });

                // VPC Node
                const vpcHeight = Math.max(100, subnetY + LAYOUT_CONFIG.vpc.padding);
                nodes.push({
                    id: vpcId,
                    type: 'group',
                    data: { label: null },
                    position: { x: LAYOUT_CONFIG.region.padding, y: vpcY },
                    style: {
                        width: LAYOUT_CONFIG.vpc.width,
                        height: vpcHeight,
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid #6366f1',
                        borderRadius: '12px'
                    },
                    parentNode: regionId,
                });
                // Label node for VPC
                nodes.push({
                    id: `${vpcId}-label`,
                    type: 'input',
                    data: { label: <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg"><Box size={18} /> {vpc.name} ({vpc.cidr})</div> },
                    position: { x: 20, y: 10 },
                    parentNode: vpcId,
                    style: { background: 'transparent', border: 'none', width: 'auto' },
                    draggable: false,
                    connectable: false,
                });

                vpcY += vpcHeight + 30;
            });

            // Region Node
            const regionHeight = Math.max(200, vpcY + LAYOUT_CONFIG.region.padding);
            nodes.push({
                id: regionId,
                type: 'group',
                data: { label: null },
                position: { x: 0, y: regionY },
                style: {
                    width: LAYOUT_CONFIG.region.width,
                    height: regionHeight,
                    border: 'none',
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                },
            });
            // Label node for Region
            nodes.push({
                id: `${regionId}-label`,
                type: 'input',
                data: { label: <div className="flex items-center gap-2 text-slate-800 font-bold text-xl"><MapPin size={24} /> {region.region}</div> },
                position: { x: 20, y: 20 },
                parentNode: regionId,
                style: { background: 'transparent', border: 'none', width: 'auto' },
                draggable: false,
                connectable: false,
            });


            regionY += regionHeight + 100; // Spacing between regions
        });

        return { nodes, edges };
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when data changes
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <div className="h-full w-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
            >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};
