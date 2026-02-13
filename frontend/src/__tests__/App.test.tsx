import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import * as useTopologyHook from '../hooks/useTopology';

// Mock the hook
const mockScan = vi.fn();
vi.spyOn(useTopologyHook, 'useTopology').mockReturnValue({
    data: [],
    loading: false,
    error: null,
    lastScanned: null,
    scan: mockScan,
});

describe('App Component', () => {
    it('renders header title', () => {
        render(<App />);
        expect(screen.getByRole('heading', { name: /AWS Global Topology Explorer/i })).toBeInTheDocument();
    });

    it('triggers scan on button click', () => {
        render(<App />);
        const button = screen.getByText(/Sync Global Topology/i);
        fireEvent.click(button);
        expect(mockScan).toHaveBeenCalled();
    });

    it('shows ready state when no data', () => {
        render(<App />);
        expect(screen.getByText(/Ready to Explore/i)).toBeInTheDocument();
    });
});
