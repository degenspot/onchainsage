![Dojo Starter](./assets/cover.png)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/mark-dark.svg">
  <img alt="Dojo logo" align="right" width="120" src=".github/mark-light.svg">
</picture>

<a href="https://x.com/ohayo_dojo">
<img src="https://img.shields.io/twitter/follow/dojostarknet?style=social"/>
</a>
<a href="https://github.com/dojoengine/dojo/stargazers">
<img src="https://img.shields.io/github/stars/dojoengine/dojo?style=social"/>
</a>

[![discord](https://img.shields.io/badge/join-dojo-green?logo=discord&logoColor=white)](https://discord.com/invite/dojoengine)
[![Telegram Chat][tg-badge]][tg-url]

[tg-badge]: https://img.shields.io/endpoint?color=neon&logo=telegram&label=chat&style=flat-square&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fdojoengine
[tg-url]: https://t.me/dojoengine

# OnChain Sage Dojo

Smart contracts for OnChain Sage - AI-driven decentralized trading assistant built with Dojo on StarkNet.

## Overview

This project contains the smart contract implementation for OnChain Sage, providing:
- Decentralized trading signal generation and management
- STRK token-based payment system for premium access
- On-chain sentiment analysis and market data storage
- Gas fee optimization for StarkNet operations

## Quick Start

### Prerequisites

- [Dojo](https://book.dojoengine.org/getting-started/quick-start) v1.5.1+
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/) (optional, for testing)
- Node.js 16+ (for CI/CD)

### Installation

1. **Install Dojo**
   ```bash
   curl -L https://install.dojoengine.org | bash
   dojoup
   ```

2. **Install Starknet Foundry** (optional)
   ```bash
   curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
   snfoundryup
   ```

3. **Clone and setup**
   ```bash
   git clone https://github.com/degenspot/onchainsage.git
   cd onchainsage/apps/dojo
   ```

## Development

### Environment Setup

1. **Copy environment template**
   ```bash
   cp config/env.template .env.dev
   ```

2. **Fill in your configuration** in `.env.dev`:
   ```bash
   # For local development
   STARKNET_RPC_URL=http://localhost:5050/
   ACCOUNT_ADDRESS=0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec
   PRIVATE_KEY=0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912
   ```

### Building

```bash
# Build the project
sozo build

# Build for release
sozo build --release
```

### Testing

```bash
# Run all tests
./scripts/test.sh

# Or run individual test suites
sozo test                    # Dojo tests
snforge test                 # Starknet Foundry tests (if available)
```

### Code Formatting

```bash
# Format and lint code
./scripts/format.sh

# Just format
scarb fmt

# Check formatting
scarb fmt --check
```

### Local Development

1. **Start Katana** (local StarkNet node)
   ```bash
   katana
   ```

2. **Deploy locally**
   ```bash
   sozo build
   sozo migrate
   ```

## Deployment

### Testnet

1. **Setup environment**
   ```bash
   cp config/env.template .env.testnet
   # Fill in testnet configuration
   ```

2. **Deploy to testnet**
   ```bash
   ./scripts/deploy-testnet.sh
   ```

### Mainnet

1. **Setup environment**
   ```bash
   cp config/env.template .env.mainnet
   # Fill in mainnet configuration
   ```

2. **Deploy to mainnet** (with safety checks)
   ```bash
   ./scripts/deploy-mainnet.sh
   ```

## Project Structure

```
apps/dojo/
├── src/
│   ├── contracts/          # Smart contracts
│   ├── models/             # Data models
│   ├── systems/            # System contracts
│   ├── libs/               # Shared libraries
│   ├── interfaces/         # Contract interfaces
│   └── tests/              # Dojo tests
├── tests_foundry/          # Starknet Foundry tests (optional)
├── scripts/                # Deployment and utility scripts
├── config/                 # Configuration files
├── .github/workflows/      # CI/CD pipelines
├── deployment/             # Deployment artifacts
└── coverage/               # Test coverage reports
```

## Configuration Files

- `Scarb.toml` - Package configuration and dependencies
- `dojo_dev.toml` - Development environment configuration
- `dojo_release.toml` - Production environment configuration
- `snfoundry.toml` - Starknet Foundry configuration
- `.scarbfmt.toml` - Code formatting rules

## Scripts

- `scripts/deploy-testnet.sh` - Deploy to StarkNet testnet
- `scripts/deploy-mainnet.sh` - Deploy to StarkNet mainnet
- `scripts/test.sh` - Run all tests
- `scripts/format.sh` - Format and lint code

## CI/CD

The project includes GitHub Actions workflows for:
- Code formatting and linting
- Running tests
- Building contracts
- Automatic deployment to testnet (on `develop` branch)
- Manual deployment to mainnet (on `main` branch)

### Required Secrets

For CI/CD to work, configure these GitHub secrets:

**Testnet:**
- `TESTNET_RPC_URL`
- `TESTNET_ACCOUNT_ADDRESS`
- `TESTNET_PRIVATE_KEY`

**Mainnet:**
- `MAINNET_RPC_URL`
- `MAINNET_ACCOUNT_ADDRESS`
- `MAINNET_PRIVATE_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure tests pass: `./scripts/test.sh`
4. Format your code: `./scripts/format.sh`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Dojo Book](https://book.dojoengine.org/)
- [StarkNet Documentation](https://docs.starknet.io/)
- [GitHub Issues](https://github.com/degenspot/onchainsage/issues)
- [Telegram](https://t.me/+Tg-UnlqyEcAxODBk)
