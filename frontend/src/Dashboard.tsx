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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
                    {subtext && <span className="text-xs text-slate-400 font-medium">{subtext}</span>}
                </div>
            </div>
            <div className={clsx("p-3 rounded-lg bg-opacity-10", color)}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                <p className="text-slate-500">Global infrastructure summary and usage metrics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Regions"
                    value={metrics.totalRegions}
                    icon={<Globe size={24} className="text-indigo-600" />}
                    color="bg-indigo-100"
                />
                <StatCard
                    title="VPCs"
                    value={metrics.totalVpcs}
                    icon={<Box size={24} className="text-blue-600" />}
                    color="bg-blue-100"
                />
                <StatCard
                    title="Subnets"
                    value={metrics.totalSubnets}
                    icon={<Layers size={24} className="text-cyan-600" />}
                    color="bg-cyan-100"
                />
                <StatCard
                    title="Instances"
                    value={metrics.totalInstances}
                    subtext={`${metrics.runningInstances} Running`}
                    icon={<Server size={24} className="text-emerald-600" />}
                    color="bg-emerald-100"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instance Distribution per Region */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Instances by Region</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={metrics.regionCounts}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="instances" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Instance Types Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Instance Types</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={metrics.typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {metrics.typeData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
