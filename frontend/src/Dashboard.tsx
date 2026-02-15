import React, { useMemo } from 'react';
import { RegionData } from './types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Globe, Box, Layers, Server } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
    data: RegionData[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
    // Calculate Metrics
    const metrics = useMemo(() => {
        let totalVpcs = 0;
        let totalSubnets = 0;
        let totalInstances = 0;
        let runningInstances = 0;
        let stoppedInstances = 0;

        const regionCounts: { name: string; instances: number }[] = [];
        const instanceTypes: Record<string, number> = {};
        const instanceStates: Record<string, number> = {};

        data.forEach(region => {
            let regionInstanceCount = 0;
            totalVpcs += region.vpcs.length;

            region.vpcs.forEach(vpc => {
                totalSubnets += vpc.subnets.length;

                vpc.subnets.forEach(subnet => {
                    totalInstances += subnet.instances.length;
                    regionInstanceCount += subnet.instances.length;

                    subnet.instances.forEach(inst => {
                        // State counts
                        if (inst.state === 'running') runningInstances++;
                        else stoppedInstances++; // Simplify for now

                        instanceStates[inst.state] = (instanceStates[inst.state] || 0) + 1;

                        // Type counts
                        instanceTypes[inst.type] = (instanceTypes[inst.type] || 0) + 1;
                    });
                });
            });

            if (region.vpcs.length > 0) {
                regionCounts.push({ name: region.region, instances: regionInstanceCount });
            }
        });

        // Format data for charts
        const typeData = Object.entries(instanceTypes)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 types

        const stateData = Object.entries(instanceStates)
            .map(([name, value]) => ({ name, value }));

        return {
            totalRegions: data.length,
            totalVpcs,
            totalSubnets,
            totalInstances,
            runningInstances,
            stoppedInstances,
            regionCounts,
            typeData,
            stateData
        };
    }, [data]);

    const StatCard = ({ title, value, icon, color, subtext }: any) => (
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between group">
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-4xl font-bold text-white tracking-tight">{value}</h3>
                    {subtext && <span className="text-xs text-white/50 font-medium">{subtext}</span>}
                </div>
            </div>
            <div className={clsx("p-4 rounded-xl bg-opacity-10 transition-transform duration-300 group-hover:scale-110", color)}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
                <p className="text-slate-400 text-sm">Real-time metrics across your global AWS infrastructure.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Regions"
                    value={metrics.totalRegions}
                    icon={<Globe size={28} className="text-indigo-400" />}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="VPC Networks"
                    value={metrics.totalVpcs}
                    icon={<Box size={28} className="text-blue-400" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Subnets"
                    value={metrics.totalSubnets}
                    icon={<Layers size={28} className="text-cyan-400" />}
                    color="bg-cyan-500"
                />
                <StatCard
                    title="Total Instances"
                    value={metrics.totalInstances}
                    subtext={`${metrics.runningInstances} ONLINE`}
                    icon={<Server size={28} className="text-emerald-400" />}
                    color="bg-emerald-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Instance Distribution per Region */}
                <div className="glass-card p-8 rounded-2xl h-[450px] border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-8 border-b border-white/5 pb-4">Global Distribution</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={metrics.regionCounts}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                            <Bar dataKey="instances" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Instance Types Breakdown */}
                <div className="glass-card p-8 rounded-2xl h-[450px] border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-8 border-b border-white/5 pb-4">Instance Typography</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={metrics.typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={6}
                                dataKey="value"
                                stroke="none"
                            >
                                {metrics.typeData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
