# onchainsage



## Services Status


**"See the Unseen, Trade the Future."**

OnChain Sage is an AI-driven, decentralized trading assistant that combines real-time social sentiment analysis with on-chain market data to identify high-potential crypto tickers. By integrating data from Twitter, Raydium, Dex Screener, and more, OnChain Sage empowers crypto traders with actionable insights to make informed decisions.

## Table of Contents

- [Overview](#overview)
- [Core Concept](#core-concept)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

OnChain Sage leverages cutting-edge AI and blockchain technologies to provide a comprehensive analysis of crypto trends. It monitors both social media sentiment and on-chain metrics to deliver reliable trading signals. The platform is built as an open-source, modular system, inviting community contributions while ensuring robust, scalable performance.

## Core Concept

- **Data-Driven Trading:** Integrates social sentiment analysis from Twitter with on-chain analytics from platforms like Raydium and Dex Screener.
- **Decentralized Payment Model:** Utilizes the Starknet network and STRK tokens to manage gas fees and premium access.
- **Open-Source Collaboration:** Encourages a vibrant contributor community with a modular monorepo structure for easy maintenance and scalability.

## Key Features

- **Real-Time Social Sentiment Analysis:** Uses NLP and ML models to analyze Twitter data and detect emerging trends.
- **On-Chain Data Insights:** Monitors liquidity, volume, and whale activity via on-chain APIs.
- **Actionable Trading Signals:** Provides categorized signals (high-confidence, emerging, risky) to guide trading decisions.
- **User-Friendly Dashboard:** A responsive Next.js-based interface with dynamic visualizations (Chart.js/D3.js).
- **Secure Blockchain Integration:** Smart contracts written in Cairo on Starknet manage STRK token transactions and premium access.
- **Modular and Open-Source:** Encourages community contributions with a well-defined monorepo structure.

## Architecture & Tech Stack

### **Frontend**

- **Framework:** Next.js, React
- **Styling:** Tailwind CSS
- **Visualizations:** Chart.js, D3.js

### **Backend**

- **Runtime:** Node.js with NestJs
- **Language:** TypeScript

### **Data Processing**

- **Languages:** Python (TensorFlow, PyTorch, OpenAI API)

### **Blockchain Integration**

- **Network:** Starknet
- **Smart Contracts:** Written in Cairo
- **Token Handling:** STRK for gas fees and premium services

### **Database & Infrastructure**

- **Database:** PostgreSQL/MongoDB, Redis for caching
- **Containerization & Orchestration:** Docker, Kubernetes
- **Deployment:** AWS/GCP or similar cloud platforms

### **API Integrations**

- **Social Data:** Twitter API
- **On-Chain Analytics:** Raydium and Dex Screener APIs

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/)
- [Python 3.8+](https://www.python.org/downloads/) (if working on data processing services)
- Docker (for containerized development)
- Access to a Starknet wallet (e.g., MetaMask or Argent)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/degenspot/onchainsage.git
   cd onchainsage
   Install Dependencies
   ```

Using npm (for workspaces):

npm install
Environment Configuration

Create environment configuration files for each app (e.g., .env in apps/frontend, apps/backend, etc.) based on the examples provided in the docs/ folder.
Run the Applications

Frontend:

"npm run dev --workspace=apps/frontend"


Backend:
"npm run start:dev --workspace=apps/backend",

Data Processing & Blockchain Services: Follow the README files in each respective directory.
Development
This project follows a monorepo structure managed via Turborepo or Nx. Each component is developed in its own folder under apps/ and shared utilities are stored under packages/.

Folder Structure:

```onchainsage/
├── apps/
│   ├── frontend/
│   ├── backend/
│   ├── blockchain/
│   └── data-processing/
├── packages/
│   ├── ui/
│   ├── sdk/
│   ├── common/
│   └── integrations/
├── docs/
├── infrastructure/
└── .github/


**Contributing**
We welcome contributions from the community! Please see our CONTRIBUTING.md for details on our code of conduct, branching strategy, and how to submit pull requests.

License
MIT License

For any questions or feedback, please open an issue or reach out to the maintainers.


```
