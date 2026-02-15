import React from 'react';
import { Globe, Server, Box, Layers, Shield, ChevronDown, Check, Activity } from 'lucide-react';
import clsx from 'clsx';

export type ResourceType = 'all' | 'vpc' | 'subnet' | 'ec2' | 'sg';

interface SidebarProps {
    regions: string[];
    selectedRegion: string;
    onRegionChange: (region: string) => void;
    selectedResource: ResourceType;
    onResourceChange: (resource: ResourceType) => void;
}

const resourceOptions: { id: ResourceType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Resources', icon: <Globe size={18} /> },
    { id: 'vpc', label: 'VPCs', icon: <Box size={18} /> },
    { id: 'subnet', label: 'Subnets', icon: <Layers size={18} /> },
    { id: 'ec2', label: 'EC2 Instances', icon: <Server size={18} /> },
    { id: 'sg', label: 'Security Groups', icon: <Shield size={18} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
    regions,
    selectedRegion,
    onRegionChange,
    selectedResource,
    onResourceChange,
}) => {
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = React.useState(false);

    return (
        <aside className="w-72 flex flex-col h-full glass-panel border-r-0 rounded-r-2xl my-4 ml-4 overflow-hidden relative z-20">
            {/* Header / Brand */}
            <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Activity size={20} className="text-white" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Topology Explorer
                    </h1>
                </div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest pl-1">
                    v2.0 Enterprise
                </p>
            </div>

            {/* Region Selector */}
            <div className="p-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 block pl-2">
                    Scope
                </label>
                <div className="relative">
                    <button
                        onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 transition-all px-4 py-3 rounded-xl text-sm font-medium text-slate-200 group shadow-lg"
                    >
                        <span className="flex items-center gap-3">
                            <Globe size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            {selectedRegion === 'all' ? 'All Regions' : selectedRegion}
                        </span>
                        <ChevronDown size={14} className={clsx("text-slate-500 transition-transform duration-300", isRegionDropdownOpen && "rotate-180")} />
                    </button>

                    {isRegionDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1a1c2e] border border-slate-700/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar p-1 ring-1 ring-white/10">
                            <button
                                onClick={() => { onRegionChange('all'); setIsRegionDropdownOpen(false); }}
                                className={clsx(
                                    "w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors",
                                    selectedRegion === 'all' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                )}
                            >
                                All Regions
                                {selectedRegion === 'all' && <Check size={14} />}
                            </button>
                            <div className="h-px bg-white/5 my-1 mx-2" />
                            {regions.map((region) => (
                                <button
                                    key={region}
                                    onClick={() => { onRegionChange(region); setIsRegionDropdownOpen(false); }}
                                    className={clsx(
                                        "w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors",
                                        selectedRegion === region ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                    )}
                                >
                                    {region}
                                    {selectedRegion === region && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Resource Type Navigation */}
            <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto custom-scrollbar">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 mt-4 block pl-2">
                    Resources
                </label>
                {resourceOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onResourceChange(option.id)}
                        className={clsx(
                            "nav-item w-full",
                            selectedResource === option.id && "active"
                        )}
                    >
                        <span className={clsx(selectedResource === option.id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")}>
                            {option.icon}
                        </span>
                        {option.label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    System Operational
                </div>
            </div>
        </aside>
    );
};
