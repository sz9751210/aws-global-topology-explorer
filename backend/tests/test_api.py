from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch('app.routers.topology.get_enabled_regions')
@patch('app.routers.topology.scan_region')
def test_get_topology(mock_scan, mock_regions):
    mock_regions.return_value = ['us-east-1']
    mock_scan.return_value = {'region': 'us-east-1', 'vpcs': []}
    
    response = client.get("/api/topology")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['region'] == 'us-east-1'
