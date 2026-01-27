# AWS Global Topology Explorer 🌍

> A powerful visualization tool for AWS infrastructure, offering a global view of your network topology across all regions.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Backend-Python_3.9-yellow.svg)
![React](https://img.shields.io/badge/Frontend-React_18-blue.svg)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED.svg)

[繁體中文 (Traditional Chinese)](./README_zh-TW.md) | [English](./README.md)

## 📖 Overview

The AWS Global Topology Explorer solves the visibility gap in AWS multi-region environments. Instead of clicking through regions one by one, this tool scans your entire AWS footprint and visualizes the relationships between **Regions**, **VPCs**, **Subnets**, and **EC2 Instances** in a single interactive dashboard.

It specifically focuses on **Security Group** visualization, resolving complex rule references (like SG IDs) into human-readable names to simplify security auditing.

## ✨ Features

- **🌐 Global Discovery**: Automatically detects and scans all enabled (opt-in) AWS Regions.
- **🏗️ Hierarchical Topology**: Visualizes resources in a tree structure: `Region -> VPC -> Subnet -> EC2`.
- **🛡️ Intelligent Security Analysis**:
    - Aggregates all Security Group rules for each instance.
    - Resolves Source Security Group IDs to their Names (e.g., shows `alb-sg` instead of `sg-01234`).
    - Merges rules from multiple attached Security Groups.
- **🚀 Dockerized**: Ready for instant deployment with Docker Compose.
- **⚡ High Performance**: Uses concurrent threading to scan multiple regions in parallel.

## 🏗 Architecture

The system follows a modern client-server architecture:

```mermaid
graph TD
    User[Browser] -->|HTTP/80| Nginx[Frontend Container (Nginx + React)]
    Nginx -->|Proxy /api| API[Backend Container (FastAPI)]
    API -->|Boto3| AWS[AWS Cloud API]
```

- **Backend**: Python (FastAPI, Boto3) handles parallel scanning and data normalization.
- **Frontend**: React (Vite, TanStack Table, Tailwind CSS) renders the interactive tree grid.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- AWS Credentials (Access Key & Secret Key) with a user/role that has `Read-Only` access (specifically `ec2:Describe*`).

### Installation via Docker Compose

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aws-global-topology-explorer.git
    cd aws-global-topology-explorer
    ```

2.  **Configure Environment:**
    Copy the example configuration file.
    ```bash
    cp .env.example .env
    ```
    Open `.env` and set `AWS_CREDENTIALS_DIR` to your local `.aws` folder path (e.g., `~/.aws`).

3.  **Start Services:**
    ```bash
    docker-compose up --build -d
    ```
    This will start:
    - Backend API on port `8000`
    - Frontend interface on port `80`

4.  **Access Dashboard:**
    Open your browser and navigate to [http://localhost](http://localhost).

## 🛠 Manual Development Setup

If you wish to run the services locally without Docker:

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API will be available at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`. Ensure `vite.config.ts` proxies `/api` to port `8000`.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
