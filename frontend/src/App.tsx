import { useState, useMemo } from 'react';
import { TopologyTable } from './TopologyTable';
import { useTopology } from './hooks/useTopology';
import { Dashboard } from './Dashboard';
import { TopologyMap } from './TopologyMap';
import { AlertCircle, BarChart3, LayoutDashboard, Map as MapIcon, RefreshCw, Table2 } from 'lucide-react';
import { Sidebar, ResourceType } from './Sidebar';
import clsx from 'clsx';
import './index.css';

type ViewType = 'explorer' | 'map' | 'dashboard';

function App() {
    // View State
    const [currentView, setCurrentView] = useState<ViewType>('explorer');

    // Filters
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [selectedResource, setSelectedResource] = useState<ResourceType>('all');

    // Data Access
    const { data, loading, error, lastScanned, scan } = useTopology();

    const availableRegions = useMemo(() => data.map((r) => r.region), [data]);

    const filteredData = useMemo(() => {
        if (selectedRegion === 'all') {
            return data;
        }
        return data.filter((r) => r.region === selectedRegion);
    }, [data, selectedRegion]);

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* Sidebar */}
            <Sidebar
                regions={availableRegions}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedResource={selectedResource}
                onResourceChange={(resource) => {
                    setSelectedResource(resource);
                    // Standardize view: if user clicks a resource filter, switch to table/explorer if not already, 
                    // unless they are in map mode which might support filtering (future). 
                    // For now, let's keep them in their current view but Explorer makes most sense for specific resource lists.
                    if (currentView === 'dashboard') {
                        setCurrentView('explorer');
                    }
                }}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AWS Global Topology Explorer</h1>
                            <p className="text-xs text-slate-500 font-medium">Internal Developer Platform</p>
                        </div>

                        {/* View Navigation */}
                        {data.length > 0 && (
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setCurrentView('explorer')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                        currentView === 'explorer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Table2 size={16} /> Explorer
                                </button>
                                <button
                                    onClick={() => setCurrentView('map')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                        currentView === 'map' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <MapIcon size={16} /> Map
                                </button>
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                        currentView === 'dashboard' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <BarChart3 size={16} /> Dashboard
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {lastScanned && (
                            <div className="text-xs text-slate-500 text-right mr-2">
                                <p>Last Synced</p>
                                <p className="font-mono">{lastScanned.toLocaleTimeString()}</p>
                            </div>
                        )}
                        <button
                            onClick={scan}
                            disabled={loading}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all',
                                loading
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                            )}
                        >
                            <RefreshCw size={16} className={clsx({ 'animate-spin': loading })} />
                            {loading ? 'Scanning...' : 'Sync Global Topology'}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {data.length === 0 && !loading && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <LayoutDashboard size={64} className="mb-4 text-slate-300" />
                            <h2 className="text-2xl font-bold text-slate-600 mb-2">Ready to Explore</h2>
                            <p className="max-w-md text-center mb-8">
                                Click the <span className="font-bold text-indigo-600">Sync</span> button to start scanning your AWS
                                Organization across all regions.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                            <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-xl max-w-lg text-center">
                                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                                <h3 className="text-lg font-bold text-red-700 mb-2">Scan Failed</h3>
                                <p className="text-red-600 text-sm mb-4">{error}</p>
                                {/* Error state is managed by hook now, but we can't clear it easily without exposing setError. 
                                    For now just hide the button or re-scan. 
                                    Let's validly fix this by just re-scanning on dismiss or similar? 
                                    Or just show the error. Detailed panel usually better.
                                    The original code had `setError(null)`. 
                                    Let's leave valid "Dismiss" logic for later or just re-scan. 
                                    For now, we just pass scan to retry.
                                */}
                                <button onClick={scan} className="text-red-700 font-medium text-sm hover:underline">
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredData.length > 0 && (
                        <>
                            {currentView === 'explorer' && (
                                <TopologyTable data={filteredData} loading={loading} resourceFilter={selectedResource} />
                            )}
                            {currentView === 'dashboard' && (
                                <Dashboard data={filteredData} />
                            )}
                            {currentView === 'map' && (
                                <TopologyMap data={filteredData} />
                            )}
                        </>
                    )}
                </main>

                {/* Status Bar */}
                <footer className="bg-white border-t border-slate-200 px-6 py-2 text-xs text-slate-500 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div
                            className={clsx(
                                'w-2 h-2 rounded-full',
                                loading ? 'bg-amber-500 animate-pulse' : data.length > 0 ? 'bg-green-500' : 'bg-slate-300'
                            )}
                        ></div>
                        <span>
                            {loading
                                ? 'Scanning AWS APIs...'
                                : data.length > 0
                                    ? `Discovered ${data.reduce((acc, r) => acc + r.vpcs.length, 0)} VPCs across ${data.length} Regions`
                                    : 'System Idle'}
                        </span>
                    </div>
                    <div>v2.0.0 - Enterprise Edition</div>
                </footer>
            </div>
        </div>
    );
}

export default App;
