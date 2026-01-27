from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import concurrent.futures
from scanner import get_enabled_regions, scan_region

app = FastAPI(title="AWS Global Topology Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/topology")
def get_topology():
    regions = get_enabled_regions()
    if not regions:
        return []

    results = []
    # Parallel scan
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_region = {executor.submit(scan_region, r): r for r in regions}
        for future in concurrent.futures.as_completed(future_to_region):
            try:
                data = future.result()
                results.append(data)
            except Exception as e:
                region = future_to_region[future]
                results.append({'region': region, 'error': str(e), 'vpcs': []})
    
    return results

@app.get("/health")
def health():
    return {"status": "ok"}
