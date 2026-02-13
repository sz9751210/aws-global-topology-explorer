import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import topology

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AWS Global Topology Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topology.router, prefix="/api", tags=["topology"])

@app.get("/health")
def health():
    return {"status": "ok"}
