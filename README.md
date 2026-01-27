# AWS Global Topology Explorer

## Backend Setup

1.  **Prerequisites:** Python 3.8+, AWS Credentials configured (`~/.aws/credentials` or Environment Variables).
2.  **Install Dependencies:**
    ```bash
    pip install boto3
    ```
3.  **Run Scanner:**
    ```bash
    cd backend
    python3 scanner.py
    ```
    This will generate `aws_topology.json` in the same directory. This JSON file is the data source for the frontend.

## Frontend Concept

The `frontend/` directory contains React components designed to be dropped into a standard React + Tailwind CSS project (e.g., initialized with Vite).

### Integration Steps:

1.  **Create a React App (if not exists):**
    ```bash
    npm create vite@latest my-app -- --template react-ts
    cd my-app
    npm install
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
2.  **Install dependencies:**
    ```bash
    npm install @tanstack/react-table
    ```
3.  **Copy Files:**
    Copy `TopologyTable.tsx`, `DetailPanel.tsx`, and `types.ts` into your `src` directory.
4.  **Usage in `App.tsx`:**
    ```tsx
    import { useEffect, useState } from 'react';
    import { TopologyTable } from './TopologyTable';
    import { RegionData } from './types';
    import data from './aws_topology.json'; // Ensure JSON is imported or fetched

    function App() {
      // In a real app, you might fetch this from an API endpoint serving the JSON
      return (
        <TopologyTable data={data as RegionData[]} />
      );
    }

    export default App;
    ```
