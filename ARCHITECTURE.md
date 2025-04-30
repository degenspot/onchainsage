# OnChain Sage Architecture Document

## Introduction

OnChain Sage is an open-source, AI-driven, decentralized trading assistant that combines real-time social sentiment analysis from X with on-chain market data from platforms like Raydium and Dex Screener. It aims to provide crypto traders with actionable insights through a user-friendly dashboard, encouraging community contributions for scalability and innovation.

This architecture document aims to provide a detailed blueprint of the system, ensuring contributors can easily understand, navigate, and extend the project. It is structured to be accessible to developers of varying experience levels, with clear guidelines for setup, development, and contribution.

## Architecture Overview

The architecture of OnChain Sage is data-first, emphasizing the flow and processing of data as the foundation of the system. It is modular and event-driven, promoting scalability and loose coupling between components. The system is divided into five key layers, each with distinct responsibilities, ensuring maintainability and adaptability for open-source contributors.

Below is a visual representation of the architecture:

![image](https://github.com/user-attachments/assets/ea932d87-4cb7-42cd-b400-1165d999bdcb)

This diagram illustrates the flow from data ingestion to user interaction, highlighting the event-driven communication and modular structure.

## System Components and Layers

The architecture is divided into five main layers, each with specific responsibilities:

### 1. Frontend Layer
- **Technologies**: Next.js, React, Tailwind CSS, Chart.js, D3.js
- **State Management**: Zustand
- **Real-time Updates**: WebSocket
- **Responsibilities**:
  - User interface and dashboard
  - Real-time data visualization
  - User interaction handling
  - WebSocket communication
- **Contributor Entry Points**:
  - Extend UI components
  - Implement new features in Zustand stores
  - Enhance WebSocket handling

### 2. Backend Layer
- **Technologies**: NestJS, Node.js, TypeScript
- **Services**:
  - API Gateway
  - Authentication Service
  - Signal Generation Service
- **Responsibilities**:
  - API request handling
  - User authentication
  - Signal coordination
  - Redis caching
- **Contributor Entry Points**:
  - Add new API endpoints
  - Enhance authentication flows
  - Optimize signal caching strategies

### 3. Data Processing Layer
- **Technologies**: Python, TensorFlow, PyTorch, OpenAI API
- **Components**:
  - Social Sentiment Analyzer
  - On-Chain Data Processor
  - Signal Aggregator
- **Responsibilities**:
  - Data ingestion
  - Sentiment analysis
  - Signal generation
  - Data aggregation
- **Contributor Entry Points**:
  - Implement new sentiment scoring algorithms
  - Integrate additional data sources
  - Optimize signal generation pipelines

### 4. Blockchain Integration
- **Network**: Starknet
- **Language**: Cairo
- **Token**: STRK
- **Framework**: Dojo (v1.2.2)
- **Responsibilities**:
  - Smart contract management using Dojo’s world-based architecture.
  - Models:
    - Signal: Stores trading signal data (e.g., token, buy/sell, confidence score, timestamp).
    - Stake: Tracks user stakes on signals (e.g., user address, signal ID, STRK amount).
    - ValidationVote: Records community votes on signal credibility (e.g., user address, signal ID, vote, reputation weight).
    - UserReputation: Manages user reputation scores based on validation accuracy.
  - Systems:
    - SignalManager: Registers new signals (register_signal), updates signal metadata, and emits events.
    - StakingSystem: Allows users to stake STRK on signals (stake_signal), tracks stakes, and distributes rewards.
    - ValidationSystem: Manages community validation (vote_signal), updates credibility scores, and adjusts user reputation.
  - Token transactions for staking and rewards.
  - Access control using Dojo’s permission system (grant_writer, revoke_writer).
  - Gas fee handling with Starknet’s fee model.
    
New Features:
Signal Staking: Users can stake STRK on trading signals to signal confidence, with rewards distributed based on signal accuracy.
Community-Driven Signal Validation: Users can vote on signal credibility, with votes weighted by reputation, influencing signal rankings.
Reputation System: Users earn reputation points based on the accuracy of their validations, impacting their voting weight.
Contributor Entry Points:
Develop new Dojo models and systems for staking, validation, and reputation.
Enhance Starknet integration with additional contract features (e.g., reward distribution logic).
Improve gas efficiency by optimizing storage and computation in Cairo.

### 5. Database and Infrastructure
- **Database**: PostgreSQL, Redis
- **Deployment**: Docker, Kubernetes
- **Cloud**: AWS/GCP
- **Responsibilities**:
  - Data persistence
  - Caching
  - Scalable deployment
  - Infrastructure management
- **Contributor Entry Points**:
  - Optimize database queries
  - Extend caching strategies
  - Contribute to deployment scripts

## Data Flow

The data-first approach ensures that data processing drives the system's functionality. The flow is as follows:

1. **Data Ingestion**
   - X API for social sentiment
   - Raydium/Dex Screener for on-chain metrics

2. **Data Processing**
   - NLP/ML analysis
   - Metric extraction
   - Signal generation

3. **Storage**
   - PostgreSQL for persistence
   - Redis for caching
   - Event logging

4. **Signal Delivery**
   - REST APIs
   - WebSocket updates
   - Real-time notifications

5. **User Interaction**
   - Dashboard interaction
   - Signal viewing
   - Payment processing

This flow ensures data is processed efficiently and delivered in real-time, enhancing user experience and system responsiveness.

## Design Patterns and Principles

### Core Principles
1. **Data-First Approach**
   - Prioritizes data processing
   - Event-driven architecture
   - Real-time updates

2. **Modular Design**
   - Independent components
   - Clear interfaces
   - Easy integration

3. **Scalability**
   - Containerized deployment
   - Distributed processing
   - Caching strategies

These patterns ensure the system is extensible, with pluggable components and clear interfaces for integration.

## Contribution Guide

OnChain Sage thrives on community contributions, and this section provides a roadmap for getting involved.

### Getting Started
1. Fork the repository on GitHub
2. Clone the forked repository to your local machine
3. Set up the development environment by following the instructions in README.md
4. Install dependencies:
   - Node.js (v14+)
   - Python 3.8+
   - Docker
   - Configure a Starknet wallet (e.g., MetaMask or Argent)

### Development
1. Run the frontend locally using `npm run dev` in the `/apps/frontend` directory
2. Start backend and data processing services using `docker compose up`
3. Refer to `/docs/development.md` for specific setup scripts and environment variables

### Testing
1. Run tests using the provided scripts:
   - `npm test` for frontend
   - `pytest` for Python services
2. Ensure test coverage is maintained
3. Follow guidelines in `/docs/testing.md`

### Submitting Contributions
1. Create a new branch for your feature or bug fix
   - Use naming convention: `feature/your-feature-name` or `bugfix/issue-description`
2. Commit changes with clear, descriptive messages
3. Open a pull request against the main branch
4. Link to any related issues
5. Follow project coding conventions:
   - `.eslintrc` for JavaScript/TypeScript
   - `.pylintrc` for Python

### Communication
- Join the project's Discord channel
- Report bugs or suggest features via GitHub issues
- Use provided templates in `.github/ISSUE_TEMPLATE`

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

