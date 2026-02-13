import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTopology } from './useTopology';

describe('useTopology Hook', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useTopology());
        expect(result.current.data).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('fetches data successfully', async () => {
        const mockData = [{ region: 'us-east-1', vpcs: [] }];
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => mockData,
        } as Response);

        const { result } = renderHook(() => useTopology());

        await act(async () => {
            await result.current.scan();
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useTopology());

        await act(async () => {
            await result.current.scan();
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toContain('Failed to load data');
        expect(result.current.loading).toBe(false);
    });
});
