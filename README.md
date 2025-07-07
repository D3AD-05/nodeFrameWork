# Node.js Backend Framework

A comprehensive, modular Node.js backend framework built with TypeScript, Express, MySQL, and Winston logging. This framework provides a solid foundation for building scalable web applications with proper error handling, authentication, and logging.

## 🚀 Features

- **Modular Architecture**: Feature-based folder structure for better organization
- **TypeScript**: Full TypeScript support with strict type checking
- **MySQL Integration**: Robust database layer with connection pooling and transactions
- **Winston Logging**: Comprehensive logging system with separate files for different request types
- **Global Error Handling**: Centralized error handling with custom error classes
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Request Validation**: Joi-based input validation
- **Rate Limiting**: Configurable rate limiting for API protection
- **Health Checks**: Database and application health monitoring
- **Security**: Helmet, CORS, and other security middleware
- **Development Tools**: Hot reload, linting, and debugging support

## 📁 Project Structure

```
/nodeFrame
│
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.ts
│   │   └── env.config.ts
│   ├── modules/           # Feature-wise modules
│   │   └── user/
│   │       ├── user.routes.ts
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       ├── user.query.ts
│   │       ├── user.types.ts
│   │       └── user.validation.ts
│   ├── middleware/        # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── request.logger.ts
│   │   ├── validation.middleware.ts
│   │   └── rate.limiter.ts
│   ├── utils/             # Utility functions
│   │   └── common.utils.ts
│   ├── logger/            # Winston logging configuration
│   │   └── winston.ts
│   ├── errors/            # Error handling
│   │   ├── error.handler.ts
│   │   ├── AppError.ts
│   │   └── error.types.ts
│   ├── db/                # Database layer
│   │   ├── connection.ts
│   │   ├── query.executor.ts
│   │   └── transaction.helper.ts
│   ├── routes/            # Route definitions
│   │   └── index.routes.ts
│   └── app.ts             # Main application file
├── database/              # Database scripts
│   └── create_users_table.sql
├── logs/                  # Log files (auto-generated)
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 2. Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials and other settings.

4. Create MySQL database and user table:
   ```bash
   mysql -u root -p < database/create_users_table.sql
   ```

### 3. Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured port).

### 4. Build for Production

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```http
GET /health
```

### Authentication Endpoints

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Endpoints (Require Authorization header)

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name"
}
```

#### Change Password
```http
PUT /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Admin Endpoints (Require admin role)

#### Get All Users
```http
GET /users?page=1&limit=10&search=john&role=user&isActive=true
Authorization: Bearer <admin-token>
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <admin-token>
```

#### Update User
```http
PUT /users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "role": "admin",
  "isActive": false
}
```

#### Delete User
```http
DELETE /users/:id
Authorization: Bearer <admin-token>
```

## 🔧 Framework Components

### Query Executor
Reusable database query execution with error handling:

```typescript
import { queryExecutor } from './db/query.executor';

// Execute single query
const result = await queryExecutor.execute('SELECT * FROM users WHERE id = ?', [userId]);

// Execute and get first row
const user = await queryExecutor.executeOne('SELECT * FROM users WHERE id = ?', [userId]);

// Check if record exists
const exists = await queryExecutor.exists('users', { email: 'test@example.com' });

// Get count
const count = await queryExecutor.count('users', { role: 'admin' });
```

### Transaction Helper
Execute multiple queries in transactions:

```typescript
import { transactionHelper } from './db/transaction.helper';

// Execute multiple queries in transaction
const results = await transactionHelper.executeTransaction([
  { query: 'INSERT INTO users (email) VALUES (?)', params: ['test@example.com'] },
  { query: 'INSERT INTO profiles (user_id) VALUES (?)', params: [userId] }
]);

// Use callback-based transaction
const result = await transactionHelper.withTransaction(async (connection) => {
  const [userResult] = await connection.execute('INSERT INTO users (email) VALUES (?)', ['test@example.com']);
  const [profileResult] = await connection.execute('INSERT INTO profiles (user_id) VALUES (?)', [userResult.insertId]);
  return { userId: userResult.insertId, profileId: profileResult.insertId };
});
```

### Error Handling
Custom error classes with proper HTTP status codes:

```typescript
import { AppError } from './errors/AppError';

// Throw custom errors
throw AppError.badRequest('Invalid input data');
throw AppError.unauthorized('Access denied');
throw AppError.notFound('User not found');
throw AppError.conflict('Email already exists');
```

### Logging
Separate log files for different types of requests:

```typescript
import { logger, logApiRequest, logError } from './logger/winston';

// Log API requests (automatically categorized by HTTP method)
logApiRequest('POST', '/api/users', { email: 'test@example.com' }, userId);

// Log errors
logError(new Error('Something went wrong'), { context: 'user creation' });

// General logging
logger.info('Application started');
logger.error('Database connection failed');
```

## 🔐 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt
- **Input Validation**: Joi schemas
- **SQL Injection Prevention**: Parameterized queries

## 📋 Environment Variables

See `.env.example` for all available configuration options:

- **Server Configuration**: PORT, NODE_ENV, API_PREFIX
- **Database Configuration**: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- **JWT Configuration**: JWT_SECRET, JWT_EXPIRES_IN
- **Logging Configuration**: LOG_LEVEL, LOG_FILE_MAX_SIZE
- **Rate Limiting**: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS

## 🚀 Adding New Modules

1. Create a new folder in `src/modules/`
2. Add the following files:
   - `module.types.ts` - TypeScript interfaces
   - `module.validation.ts` - Joi validation schemas
   - `module.query.ts` - Database queries
   - `module.service.ts` - Business logic
   - `module.controller.ts` - Route handlers
   - `module.routes.ts` - Route definitions

3. Register routes in `src/routes/index.routes.ts`

## 🧪 Testing

The framework is ready for testing integration. Add your preferred testing framework (Jest, Mocha, etc.) and create tests in a `tests/` directory.

## 📝 Contributing

1. Follow the established code structure
2. Add proper TypeScript types
3. Include error handling
4. Write comprehensive tests
5. Update documentation

## 📄 License

This project is licensed under the MIT License.