# AWS 全域拓撲管理員 (AWS Global Topology Explorer) 🌍

> 一個 AWS 雲端基礎架構的強大可視化工具，提供跨所有區域 (Regions) 的網路資源拓撲檢視。

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Backend-Python_3.9-yellow.svg)
![React](https://img.shields.io/badge/Frontend-React_18-blue.svg)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED.svg)

[繁體中文 (Traditional Chinese)](./README_zh-TW.md) | [English](./README.md)

## 📖 專案概觀

**AWS Global Topology Explorer** 解決了在多區域環境下，難以快速掌握整體資源分佈與安全配置的問題。它能自動掃描並視覺化呈現 `Region -> VPC -> Subnet -> EC2 Instance` 的層級關係，並專注於 **安全群組 (Security Group)** 的關聯分析。

透過這個 IDP (Internal Developer Platform) 工具，您不再需要逐一切換 Region 頁面，而是可以在單一儀表板中進行全局稽核。

## ✨ 核心功能

- **🌐 全域資源掃描**: 自動偵測並遍歷所有已啟用 (Opt-in) 的 AWS Regions。
- **🏗️ 階層化拓撲**: 以樹狀結構呈現基礎設施：VPC、Subnet 與 EC2 實例的從屬關係。
- **🛡️ 智慧型安全分析**:
    - **規則聚合**: 自動展開並整合 EC2 所有關聯 Security Group 的 Inbound Rules。
    - **名稱解析**: 將原始的來源 Security Group ID (如 `sg-01234abc`) 自動轉換為可讀的名稱 (如 `Web-Load-Balancer-SG`)，便於理解流量來源。
    - **並行加速**: 使用 Python `concurrent.futures` 執行多區域並發掃描，大幅縮短等待時間。
- **🚀 容器化部署**: 支援 Docker Compose 一鍵啟動，開箱即用。

## 🏗 系統架構

本專案採用現代化的前後端分離架構：

```mermaid
graph TD
    user[瀏覽器 User] -->|HTTP/80| nginx[前端容器 (Nginx + React)]
    nginx -->|Proxy /api| api[後端容器 (FastAPI)]
    api -->|Boto3 SDK| aws[AWS Cloud API]
```

- **Backend (Python)**: 使用 FastAPI 搭配 Boto3 進行多執行緒掃描與資料正規化。
- **Frontend (React)**: 使用 Vite, TanStack Table v8 與 Tailwind CSS 建構互動式樹狀表格。

## 🚀 快速開始 (Quick Start)

### 前置需求
- 已安裝 Docker 與 Docker Compose。
- 有效的 AWS 憑證 (Access Key & Secret Key)；建議建立一個具有 `ReadOnlyAccess` 權限的 IAM User。

### 使用 Docker Compose 安裝 (推薦)

1.  **取得專案:**
    ```bash
    git clone https://github.com/your-username/aws-global-topology-explorer.git
    cd aws-global-topology-explorer
    ```

2.  **設定環境變數:**
    複製範例設定檔，並設定您的 AWS 憑證路徑。
    ```bash
    cp .env.example .env
    ```
    
    編輯 `.env` 檔案，確保 `AWS_CREDENTIALS_DIR` 指向您本機存放 `.aws` 憑證的資料夾 (例如 MacOS/Linux 預設為 `~/.aws`)。

3.  **啟動服務:**
    ```bash
    docker-compose up --build -d
    ```
    此命令將啟動：
    - 後端 API (Port `8000`)
    - 前端介面 (Port `80`)

4.  **開始使用:**
    打開瀏覽器訪問 [http://localhost](http://localhost)。

## 🛠 手動開發環境建置

若您希望在本機直接執行程式碼而不透過 Docker：

### 後端 (Backend)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API 文件位於：`http://localhost:8000/docs`

### 前端 (Frontend)
```bash
cd frontend
npm install
npm run dev
```
前端介面位於：`http://localhost:5173`。請確保 `vite.config.ts` 中的 Proxy 設定正確指向後端 Port。

## 📜 授權 (License)

本專案採用 [MIT License](LICENSE) 授權 - 詳情請見 LICENSE 檔案。
