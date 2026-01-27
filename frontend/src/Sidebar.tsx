import React from 'react';
import { Globe, Server, Box, Layers, Shield, ChevronDown, Check } from 'lucide-react';
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
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-700/50">
            {/* Region Selector */}
            <div className="p-4 border-b border-slate-700/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Region
                </label>
                <div className="relative">
                    <button
                        onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                        className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 transition-colors px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200"
                    >
                        <span className="flex items-center gap-2">
                            <Globe size={16} className="text-indigo-400" />
                            {selectedRegion === 'all' ? 'All Regions' : selectedRegion}
                        </span>
                        <ChevronDown size={16} className={clsx("transition-transform", isRegionDropdownOpen && "rotate-180")} />
                    </button>

                    {isRegionDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => { onRegionChange('all'); setIsRegionDropdownOpen(false); }}
                                className={clsx(
                                    "w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex items-center justify-between",
                                    selectedRegion === 'all' && "text-indigo-400 bg-slate-700/50"
                                )}
                            >
                                All Regions
                                {selectedRegion === 'all' && <Check size={14} />}
                            </button>
                            {regions.map((region) => (
                                <button
                                    key={region}
                                    onClick={() => { onRegionChange(region); setIsRegionDropdownOpen(false); }}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex items-center justify-between",
                                        selectedRegion === region && "text-indigo-400 bg-slate-700/50"
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
            <nav className="flex-1 p-4 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                    Resource Type
                </label>
                {resourceOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onResourceChange(option.id)}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            selectedResource === option.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                    >
                        <span className={clsx(selectedResource === option.id ? "text-white" : "text-slate-500")}>
                            {option.icon}
                        </span>
                        {option.label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500">
                AWS Global Topology Explorer
            </div>
        </aside>
    );
};
