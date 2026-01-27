import { useState, useMemo } from 'react';
import { TopologyTable } from './TopologyTable';
import { RegionData } from './types';
import { RefreshCw, LayoutDashboard, AlertCircle } from 'lucide-react';
import { Sidebar, ResourceType } from './Sidebar';
import clsx from 'clsx';
import './index.css';

function App() {
    const [data, setData] = useState<RegionData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<Date | null>(null);

    // Filters
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [selectedResource, setSelectedResource] = useState<ResourceType>('all');

    const availableRegions = useMemo(() => data.map((r) => r.region), [data]);

    const filteredData = useMemo(() => {
        if (selectedRegion === 'all') {
            return data;
        }
        return data.filter((r) => r.region === selectedRegion);
    }, [data, selectedRegion]);

    const fetchTopology = () => {
        setLoading(true);
        setError(null);
        fetch('/api/topology')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then((fetchedData) => {
                setData(fetchedData);
                setLastScanned(new Date());
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch topology:', err);
                setError('Failed to load data. Ensure backend is running and AWS credentials are valid.');
                setLoading(false);
            });
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* Sidebar */}
            <Sidebar
                regions={availableRegions}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedResource={selectedResource}
                onResourceChange={setSelectedResource}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">AWS Global Topology Explorer</h1>
                        <p className="text-xs text-slate-500 font-medium">Internal Developer Platform</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {lastScanned && (
                            <div className="text-xs text-slate-500 text-right mr-2">
                                <p>Last Synced</p>
                                <p className="font-mono">{lastScanned.toLocaleTimeString()}</p>
                            </div>
                        )}
                        <button
                            onClick={fetchTopology}
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
                                <button onClick={() => setError(null)} className="text-red-700 font-medium text-sm hover:underline">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredData.length > 0 && (
                        <TopologyTable data={filteredData} loading={loading} resourceFilter={selectedResource} />
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
                    <div>v1.0.0</div>
                </footer>
            </div>
        </div>
    );
}

export default App;
