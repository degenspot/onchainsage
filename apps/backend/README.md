# OnchainSage Backend

The backend service for OnchainSage, an AI-driven decentralized trading assistant that combines real-time social sentiment analysis with on-chain market data.

## 🚀 Features

- **Authentication System**: Secure user authentication and authorization
- **Trading Signals**: Real-time crypto trading signals and analysis
- **Health Monitoring**: System health and status endpoints
- **Database Integration**: PostgreSQL with TypeORM
- **Environment Configuration**: Flexible environment-based configuration

## ⚙️ Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT-based authentication
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit and e2e tests

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── auth/         # Authentication module
│   ├── config/       # Configuration files
│   ├── health/       # Health check endpoints
│   ├── signals/      # Trading signals module
│   ├── app.module.ts # Main application module
│   ├── main.ts       # Application entry point
│   └── app.service.ts # Core application service
├── test/             # Test files
└── package.json      # Dependencies and scripts
```

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- npm or yarn

## 🚀 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/degenspot/onchainsage.git
   cd onchainsage/apps/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.development.example .env.development
   
   # Edit .env.development with your database credentials
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - Update database credentials in `.env.development`

5. **Start the Development Server**
   ```bash
   # Development with hot-reload
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

## 📝 Available Scripts

- `npm run start:dev`: Start development server with hot-reload
- `npm run start:prod`: Start production server
- `npm run build`: Build the application
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run test:cov`: Generate test coverage report
- `npm run lint`: Run linter
- `npm run format`: Format code with Prettier

## 🔒 Environment Variables

Required environment variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=onchainsage

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# API
PORT=3000
NODE_ENV=development
```

## 🧪 Testing

The project includes:
- Unit tests with Jest
- E2E tests
- Test coverage reporting
- Integration tests

Run tests with:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the maintainers.
