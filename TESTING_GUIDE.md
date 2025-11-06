# Campus-Pass Testing Guide

## Overview

This guide provides comprehensive information about testing the Campus-Pass application. It covers unit tests, integration tests, and best practices for writing maintainable tests.

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Testing Stack

### Backend Testing
- **Jest**: Testing framework
- **MongoDB Memory Server**: In-memory database for tests
- **Supertest**: HTTP assertion library (for integration tests)
- **@faker-js/faker**: Generate realistic test data

### Frontend Testing (Planned)
- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing
- **MSW**: Mock Service Worker for API mocking
- **Playwright**: End-to-end testing

## Running Tests

### Backend Tests

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

### Test Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:verbose": "jest --verbose"
}
```

## Test Structure

### Directory Organization

```
backend/src/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── helpers/
│   │   └── faker-mock.ts          # Custom mocks
│   ├── unit/                       # Unit tests
│   │   ├── auth.service.test.ts
│   │   └── outpass.service.test.ts
│   ├── integration/                # Integration tests
│   │   ├── auth.routes.test.ts
│   │   └── outpass.routes.test.ts
│   └── e2e/                        # End-to-end tests
│       └── outpass-flow.test.ts
```

### Test File Naming

- Unit tests: `*.service.test.ts`, `*.controller.test.ts`
- Integration tests: `*.routes.test.ts`, `*.api.test.ts`
- E2E tests: `*.e2e.test.ts`, `*-flow.test.ts`

## Writing Tests

### AAA Pattern

All tests follow the **Arrange-Act-Assert** pattern:

```typescript
it('should create a new user', async () => {
  // ARRANGE: Set up test data and preconditions
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Test@123',
  };

  // ACT: Execute the function being tested
  const user = await authService.register(userData);

  // ASSERT: Verify the results
  expect(user).toBeDefined();
  expect(user.email).toBe(userData.email);
});
```

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/AuthService';
import { faker } from '@faker-js/faker';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.password).not.toBe(userData.password);
    });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import { app } from '../../server';

describe('POST /api/auth/register', () => {
  it('should register a new student', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@123',
        role: 'student',
        rollNumber: 'ST001',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Testing Async Code

```typescript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Testing promises
it('should resolve promise', () => {
  return expect(promiseFunction()).resolves.toBe(value);
});

// Testing rejections
it('should reject with error', () => {
  return expect(promiseFunction()).rejects.toThrow('Error message');
});
```

### Testing Error Cases

```typescript
it('should throw error for invalid input', async () => {
  await expect(
    service.createUser({ email: 'invalid' })
  ).rejects.toThrow('Invalid email format');
});

it('should return 400 for missing fields', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({})
    .expect(400);

  expect(response.body.error).toBeDefined();
});
```

## Test Coverage

### Current Coverage

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
services/AuthService    |   70.00 |    50.00 |   66.67 |   70.00
services/OutpassService |   57.14 |    40.00 |   50.00 |   57.14
------------------------|---------|----------|---------|--------
All files               |    8.00 |     5.00 |    7.00 |    8.00
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows

### Viewing Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ❌ Bad: Tests depend on each other
let userId;
it('should create user', async () => {
  const user = await createUser();
  userId = user.id; // Shared state
});

it('should get user', async () => {
  const user = await getUser(userId); // Depends on previous test
});

// ✅ Good: Each test is independent
it('should create user', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
});

it('should get user', async () => {
  const user = await createUser(); // Create own test data
  const fetched = await getUser(user.id);
  expect(fetched).toBeDefined();
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('test1', () => {});
it('works', () => {});

// ✅ Good
it('should create user with hashed password', () => {});
it('should throw error for duplicate email', () => {});
it('should return 401 for invalid credentials', () => {});
```

### 3. Test One Thing at a Time

```typescript
// ❌ Bad: Testing multiple things
it('should handle user operations', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
  
  const updated = await updateUser(user.id);
  expect(updated).toBeDefined();
  
  await deleteUser(user.id);
  const deleted = await getUser(user.id);
  expect(deleted).toBeNull();
});

// ✅ Good: Separate tests
it('should create user', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
});

it('should update user', async () => {
  const user = await createUser();
  const updated = await updateUser(user.id);
  expect(updated).toBeDefined();
});
```

### 4. Use Faker for Test Data

```typescript
import { faker } from '@faker-js/faker';

// Generate realistic test data
const testUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: faker.location.streetAddress(),
};
```

### 5. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clean up database
  await User.deleteMany({});
  await Outpass.deleteMany({});
});

afterAll(async () => {
  // Close connections
  await mongoose.connection.close();
});
```

### 6. Mock External Dependencies

```typescript
// Mock email service
jest.mock('../../services/email.service', () => ({
  EmailService: {
    sendEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Mock QR code generation
jest.mock('../../services/qrcode.service', () => ({
  QRCodeService: {
    generateQRCode: jest.fn().mockResolvedValue('mock-qr-code'),
  },
}));
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Memory Server Timeout

```typescript
// Increase timeout in jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
};
```

#### 2. ESM Module Issues

```typescript
// Use custom mock for ESM modules
// See: src/__tests__/helpers/faker-mock.ts
```

#### 3. Mongoose Validation Errors

```typescript
// Ensure all required fields are provided
const validUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedpassword',
  role: UserRole.STUDENT,
  rollNumber: 'ST001', // Required for students
};
```

#### 4. Test Isolation Issues

```typescript
// Clear database before each test
beforeEach(async () => {
  await User.deleteMany({});
  await Outpass.deleteMany({});
});
```

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- auth.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Checklist

Before submitting code, ensure:

- [ ] All tests pass
- [ ] New features have tests
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] Tests are independent
- [ ] Test names are descriptive
- [ ] Coverage meets minimum threshold
- [ ] No console errors or warnings

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Next Steps

1. **Add Integration Tests**: Test HTTP endpoints with Supertest
2. **Add Frontend Tests**: Component and hook testing with Vitest
3. **Add E2E Tests**: Critical user flows with Playwright
4. **Improve Coverage**: Aim for 80%+ coverage
5. **CI/CD Integration**: Run tests automatically on push

---

**Last Updated**: 2025-01-06
**Maintainer**: Campus-Pass Development Team