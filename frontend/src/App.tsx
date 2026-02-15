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
        <div className="flex h-screen overflow-hidden p-4 gap-4 selection:bg-indigo-500/30">
            {/* Sidebar - Now floating */}
            <Sidebar
                regions={availableRegions}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedResource={selectedResource}
                onResourceChange={(resource) => {
                    setSelectedResource(resource);
                    if (currentView === 'dashboard') {
                        setCurrentView('explorer');
                    }
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 glass-panel rounded-2xl overflow-hidden relative">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-8">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                {currentView === 'dashboard' ? 'Overview' :
                                    currentView === 'map' ? 'Global Network Map' : 'Resource Explorer'}
                            </h2>
                        </div>

                        {/* View Navigation */}
                        {data.length > 0 && (
                            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setCurrentView('explorer')}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        currentView === 'explorer' ? "bg-indigo-600 shadow-lg shadow-indigo-500/25 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Table2 size={16} /> Explorer
                                </button>
                                <button
                                    onClick={() => setCurrentView('map')}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        currentView === 'map' ? "bg-indigo-600 shadow-lg shadow-indigo-500/25 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <MapIcon size={16} /> Map
                                </button>
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        currentView === 'dashboard' ? "bg-indigo-600 shadow-lg shadow-indigo-500/25 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <BarChart3 size={16} /> Dashboard
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        {lastScanned && (
                            <div className="text-xs text-slate-400 text-right">
                                <p className="opacity-60 uppercase tracking-widest text-[10px]">Last Synced</p>
                                <p className="font-mono text-indigo-300">{lastScanned.toLocaleTimeString()}</p>
                            </div>
                        )}
                        <button
                            data-testid="sync-button"
                            onClick={scan}
                            disabled={loading}
                            className={clsx(
                                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border border-white/10',
                                loading
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                            )}
                        >
                            <RefreshCw size={18} className={clsx({ 'animate-spin': loading })} />
                            {loading ? 'Scanning...' : 'Sync Data'}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {data.length === 0 && !loading && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="p-8 rounded-full bg-white/5 border border-white/5 mb-6 animate-pulse">
                                <LayoutDashboard size={64} className="text-slate-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Ready to Explore</h2>
                            <p className="max-w-md text-center text-slate-400 mb-8 leading-relaxed">
                                Click the <span className="font-bold text-indigo-400">Sync Data</span> button to scan your AWS Organization and visualize your global infrastructure.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                            <div className="bg-[#1a1c2e] p-8 rounded-2xl border border-red-500/30 shadow-2xl max-w-lg text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                    <AlertCircle size={32} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Scan Failed</h3>
                                <p className="text-red-300/80 text-sm mb-6 leading-relaxed bg-red-950/30 p-4 rounded-lg border border-red-500/10 font-mono">
                                    {error}
                                </p>
                                <button
                                    onClick={scan}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors border border-red-400/30"
                                >
                                    Retry Connection
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
            </div>
        </div>
    );
}

export default App;
