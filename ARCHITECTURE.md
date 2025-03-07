Architecture Document Overview
Introduction to OnChain Sage

OnChain Sage is an open-source, AI-driven, decentralized trading assistant that combines real-time social sentiment analysis from X with on-chain market data from platforms like Raydium and Dex Screener. It aims to provide crypto traders with actionable insights through a user-friendly dashboard, encouraging community contributions for scalability and innovation.

System Components and Layers

The architecture is divided into five main layers, each with specific responsibilities:

Frontend Layer: Built with Next.js and React, using Tailwind CSS for styling and Chart.js/D3.js for visualizations. It manages state with Zustand for simplicity and supports real-time updates via WebSocket.
Backend Layer: Uses NestJS and Node.js with TypeScript, handling API requests, authentication, and signal generation, coordinating with other layers.
Data Processing Layer: Python-based, using TensorFlow, PyTorch, and OpenAI API for social sentiment analysis and on-chain data processing, generating trading signals.
Blockchain Integration: Utilizes Starknet with Cairo smart contracts for STRK token transactions, managing gas fees and premium access.
Database and Infrastructure: Employs PostgreSQL for persistent storage, Redis for caching, and is deployed with Docker and Kubernetes on cloud platforms like AWS or GCP.
Data Flow and Operations

Data flows from ingestion (X API, Raydium, Dex Screener) to processing (sentiment analysis, metric extraction) in the Data Processing Layer, then to storage (PostgreSQL, Redis). The Backend Layer exposes APIs and WebSockets for the Frontend to fetch and receive real-time updates, while Blockchain handles payments via smart contracts.

Design Patterns and Principles

The system follows a data-first approach, prioritizing data processing as the core driver. It uses event-driven architecture for loose coupling, modular design for scalability, and Zustand for lightweight frontend state management, ensuring adaptability for contributors.

Contribution Guidelines for Open-Source Developers

Getting Started: Fork the repository, clone it, and set up the environment as per README.md, including installing dependencies and configuring local settings.
Development: Run the frontend with npm run dev, and use docker compose up for backend and data services.
Testing: Follow testing instructions in README.md, using provided scripts and frameworks.
Submitting Contributions: Create pull requests with clear descriptions, adhere to coding conventions, and ensure tests pass.
Communication: Join the Discord channel for discussions and report issues via GitHub issues.
Comprehensive Architecture Document for OnChain Sage
Introduction
OnChain Sage is an innovative, open-source project designed as an AI-driven, decentralized trading assistant. It integrates real-time social sentiment analysis from X with on-chain market data from platforms like Raydium and Dex Screener to deliver actionable insights for crypto traders. The project's primary goal is to empower the trading community with reliable signals, fostering a collaborative, scalable ecosystem through open-source contributions.

This architecture document aims to provide a detailed blueprint of the system, ensuring contributors can easily understand, navigate, and extend the project. It is structured to be accessible to developers of varying experience levels, with clear guidelines for setup, development, and contribution.

Architecture Overview
The architecture of OnChain Sage is data-first, emphasizing the flow and processing of data as the foundation of the system. It is modular and event-driven, promoting scalability and loose coupling between components. The system is divided into five key layers, each with distinct responsibilities, ensuring maintainability and adaptability for open-source contributors.

Below is a visual representation of the architecture:

![image](https://github.com/user-attachments/assets/ea932d87-4cb7-42cd-b400-1165d999bdcb)

This diagram illustrates the flow from data ingestion to user interaction, highlighting the event-driven communication and modular structure.

System Components
To facilitate contributions, each component is described below with its technologies, responsibilities, and how contributors can engage with it.

Frontend Layer
Technologies: Next.js, React, Tailwind CSS, Chart.js, D3.js
State Management: Zustand for lightweight, reactive state handling
Real-time Updates: WebSocket for live signal updates
Responsibilities: Provides a responsive, interactive dashboard for users to view trading signals, manage preferences, and interact with STRK payments. It includes dynamic visualizations for data presentation.
Contributor Entry Points: Extend UI components (e.g., add new charts), implement new features in Zustand stores, or enhance WebSocket handling for real-time updates.
Backend Layer
Technologies: NestJS, Node.js, TypeScript
Services: API Gateway, Authentication Service, Signal Generation Service
Responsibilities: Handles API requests from the frontend, manages user authentication via Starknet wallets, and coordinates with the data processing layer to generate and serve trading signals. It also caches frequently accessed data in Redis for performance.
Contributor Entry Points: Add new API endpoints, enhance authentication flows, or optimize signal caching strategies.
Data Processing Layer
Technologies: Python, TensorFlow, PyTorch, OpenAI API
Components: Social Sentiment Analyzer, On-Chain Data Processor, Signal Aggregator
Responsibilities: Ingests data from X API and on-chain sources, processes it using AI/ML models to generate sentiment scores and metrics, and aggregates them into categorized trading signals (e.g., high-confidence, emerging, risky).
Contributor Entry Points: Implement new sentiment scoring algorithms, integrate additional data sources, or optimize signal generation pipelines.
Blockchain Integration
Network: Starknet
Language: Cairo for smart contracts
Token: STRK for gas fees and premium access
Responsibilities: Manages decentralized payments and access control through smart contracts, ensuring secure and transparent STRK token transactions.
Contributor Entry Points: Develop new contract features, enhance Starknet integration, or improve gas efficiency.
Database and Infrastructure
Database: PostgreSQL for persistent storage, Redis for caching
Deployment: Docker for containerization, Kubernetes for orchestration, AWS/GCP for cloud hosting
Responsibilities: Stores processed data and signals, caches for quick access, and ensures scalable, reliable deployment across cloud platforms.
Contributor Entry Points: Optimize database queries, extend caching strategies, or contribute to deployment scripts.
Data Flow
The data-first approach ensures that data processing drives the system's functionality. The flow is as follows:

Data Ingestion: Raw data is fetched from X API for social sentiment and from Raydium/Dex Screener APIs for on-chain metrics.
Data Processing: The Data Processing Layer analyzes social data for sentiment using NLP/ML models and extracts on-chain metrics like liquidity and volume. These are combined to generate trading signals.
Storage: Processed signals are stored in PostgreSQL for persistence and cached in Redis for quick access. Events (e.g., signal_generated) are logged for auditability.
Signal Delivery: The Backend Layer exposes REST APIs and WebSockets, allowing the Frontend to fetch signals and receive real-time updates via Zustand.
User Interaction: Users interact with the dashboard, view signals, and manage preferences. Blockchain integration handles STRK payments and premium access via smart contracts.
This flow ensures data is processed efficiently and delivered in real-time, enhancing user experience and system responsiveness.

Design Patterns and Principles
To maintain scalability and adaptability, OnChain Sage follows several design patterns:

Data-First Approach: Prioritizes data processing as the core, with other layers reacting to data changes, ensuring the system is driven by insights.
Event-Driven Architecture: Uses events (e.g., RabbitMQ) for communication between layers, promoting loose coupling and real-time updates.
Modular Design: Each layer is independent, allowing contributors to work on specific components without affecting others.
State Management with Zustand: Simplifies frontend state handling, reducing boilerplate and making it easier for contributors to manage UI state.
These patterns ensure the system is extensible, with pluggable components (e.g., sentiment scorers) and clear interfaces for integration.

Contribution Guide
OnChain Sage thrives on community contributions, and this section provides a roadmap for getting involved.

Getting Started
Fork the repository on GitHub at OnChain Sage Repository.
Clone the forked repository to your local machine.
Set up the development environment by following the instructions in README.md, including installing Node.js (v14+), Python 3.8+, Docker, and configuring a Starknet wallet (e.g., MetaMask or Argent).
Development
Run the frontend locally using npm run dev in the /apps/frontend directory.
Start backend and data processing services using docker compose up in the root directory, ensuring all dependencies are installed as per requirements.txt and package.json.
Refer to /docs/development.md for specific setup scripts and environment variables.
Testing
Run tests using the provided scripts, such as npm test for frontend and pytest for Python services, as detailed in README.md.
Ensure test coverage is maintained, with guidelines in /docs/testing.md.
Submitting Contributions
Create a new branch for your feature or bug fix, following the naming convention feature/your-feature-name or bugfix/issue-description.
Commit changes with clear, descriptive messages (e.g., feat: add sentiment scorer strategy).
Open a pull request against the main branch, linking to any related issues and providing a detailed description.
Follow the project's coding conventions, outlined in .eslintrc for JavaScript/TypeScript and .pylintrc for Python.
Communication
Join the project's Discord channel at OnChain Sage Discord for discussions and support.
Report bugs or suggest features by creating issues on GitHub, using the provided templates in .github/ISSUE_TEMPLATE.
This guide ensures contributors can engage effectively, with clear paths for collaboration and innovation.

License
OnChain Sage is released under the MIT License, promoting open-source development and community involvement. For the full license text, refer to LICENSE in the repository.

