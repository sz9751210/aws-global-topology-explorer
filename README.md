# AWS Global Topology Explorer

這是一個用於全域檢視 AWS 網路資源拓撲的 IDP 內部工具。它可以跨 Region 掃描 VPC、Subnet、EC2 實例，並視覺化 Security Group 的關聯。

## 功能特色 (Features)

*   **全域掃描:** 自動遍歷所有 Opt-in 的 AWS Regions。
*   **階層化視圖:** Region -> VPC -> Subnet -> EC2。
*   **即時安全規則:** 解析並展開 EC2 的 Inbound Security Group Rules，自動將 SG ID 轉換為可讀的名稱。
*   **容器化部署:** 支援 Docker Compose 一鍵啟動。

## 快速開始 (Quick Start)

### 使用 Docker Compose (推薦)

確保您已安裝 Docker 與 Docker Compose，並且本機已設定 AWS Credentials (環境變數或 `~/.aws/credentials`)。

1.  **啟動服務:**
    ```bash
    export AWS_PROFILE=your-profile  # 如果需要指定 Profile
    docker-compose up --build
    ```
    *注意: 如果使用 `~/.aws/credentials`，docker-compose.yml 預設會掛載此路徑。*

2.  **存取應用:**
    打開瀏覽器訪問 `http://localhost`

### 手動開發 (Manual Setup)

#### Backend (Python / FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
API 將在 `http://localhost:8000` 運行。

#### Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```
前端將在 `http://localhost:5173` 運行 (需確保 `vite.config.ts` 中的 Proxy 設定正確指向後端)。

## 架構說明 (Architecture)

*   **Backend:** Python 3.9 + Boto3 + FastAPI + Concurrent Futures (多執行緒並發掃描)。
*   **Frontend:** React + TypeScript + TanStack Table + Tailwind CSS。
*   **Infrastructure:** Nginx 作為 Reverse Proxy，將 `/api` 請求轉發至 Backend。

## 專案結構 (Project Structure)

*   `backend/`: Python 原始碼, Dockerfile
*   `frontend/`: React 原始碼, Dockerfile, Nginx 設定
*   `docker-compose.yml`: 服務編排設定
