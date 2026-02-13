import { useState, useCallback } from 'react';
import { RegionData } from '../types';

export function useTopology() {
    const [data, setData] = useState<RegionData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<Date | null>(null);

    const scanDefault = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/topology');
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const fetchedData = await res.json();
            setData(fetchedData);
            setLastScanned(new Date());
        } catch (err: any) {
            console.error('Failed to fetch topology:', err);
            setError('Failed to load data. Ensure backend is running and AWS credentials are valid.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, lastScanned, scan: scanDefault };
}
