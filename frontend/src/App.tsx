import { useEffect, useState } from 'react';
import { TopologyTable } from './TopologyTable';
import { RegionData } from './types';
import './index.css';

function App() {
    const [data, setData] = useState<RegionData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/topology')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch topology:", err);
                setError("Failed to load data. Ensure backend is running and AWS credentials are valid.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 font-bold text-gray-600">Loading AWS Topology... (Scanning regions may take a moment)</div>;
    if (error) return <div className="p-10 font-bold text-red-600">{error}</div>;

    return (
        <TopologyTable data={data} />
    );
}

export default App;
