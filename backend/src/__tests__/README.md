# Campus-Pass Backend Tests

This directory contains all backend tests for the Campus-Pass application.

## Directory Structure

```
__tests__/
├── README.md                    # This file
├── setup.ts                     # Global test setup
├── helpers/                     # Test utilities and mocks
│   └── faker-mock.ts           # Custom Faker mock for ESM compatibility
├── unit/                        # Unit tests
│   ├── auth.service.test.ts    # AuthService tests (20 tests)
│   ├── auth.controller.test.ts # AuthController tests (15 tests)
│   └── outpass.service.test.ts # OutpassService tests (15 tests)
└── integration/                 # Integration tests
    └── auth.routes.test.ts     # Auth routes tests (40+ tests)
```

## Test Categories

### Unit Tests
Test individual functions and methods in isolation.

**Files:**
- `auth.service.test.ts`: Tests for authentication service logic
- `auth.controller.test.ts`: Tests for authentication controller logic
- `outpass.service.test.ts`: Tests for outpass service logic

**Coverage:**
- AuthService: 70% statements, 50% branches
- OutpassService: 57% statements, 40% branches

### Integration Tests
Test HTTP endpoints with actual requests.

**Files:**
- `auth.routes.test.ts`: Tests for authentication API endpoints

**Coverage:**
- All authentication endpoints
- Request validation
- Error handling
- Response formats

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test -- auth.service.test.ts
```

### Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create"
```

## Test Results

### Current Status
```
Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        ~10s
```

### Coverage
```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
services/AuthService    |   70.00 |    50.00 |   66.67 |   70.00
services/OutpassService |   57.14 |    40.00 |   50.00 |   57.14
```

## Writing Tests

### Test Structure

All tests follow the **AAA (Arrange-Act-Assert)** pattern:

```typescript
it('should create user with hashed password', async () => {
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
  expect(user.password).not.toBe(userData.password);
});
```

### Test Naming

Use descriptive names that explain what is being tested:

```typescript
✅ it('should create user with hashed password', ...)
✅ it('should throw error for duplicate email', ...)
✅ it('should return 401 for invalid credentials', ...)

❌ it('test1', ...)
❌ it('works', ...)
```

### Using Faker

Generate realistic test data:

```typescript
import { faker } from '@faker-js/faker';

const testUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
};
```

### Test Independence

Each test should be independent:

```typescript
beforeEach(async () => {
  // Clean database before each test
  await User.deleteMany({});
  await Outpass.deleteMany({});
});
```

## Test Examples

### Unit Test Example

```typescript
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should register a new user', async () => {
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'Test@123',
      role: UserRole.STUDENT,
      rollNumber: 'ST001',
    };

    const user = await authService.register(userData);

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email.toLowerCase());
  });
});
```

### Integration Test Example

```typescript
describe('POST /api/auth/register', () => {
  it('should register a new student', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@123',
        role: 'student',
        rollNumber: 'ST001',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## Common Issues

### 1. MongoDB Memory Server Timeout

**Problem:** Tests timeout waiting for MongoDB
**Solution:** Increase timeout in `jest.config.js`:

```javascript
module.exports = {
  testTimeout: 30000, // 30 seconds
};
```

### 2. ESM Module Issues

**Problem:** Faker.js ESM import errors
**Solution:** Use custom mock in `helpers/faker-mock.ts`

### 3. Test Isolation

**Problem:** Tests affecting each other
**Solution:** Clean database in `beforeEach`:

```typescript
beforeEach(async () => {
  await User.deleteMany({});
  await Outpass.deleteMany({});
});
```

### 4. Mongoose Validation Errors

**Problem:** Missing required fields
**Solution:** Provide all required fields:

```typescript
const validUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedpassword',
  role: UserRole.STUDENT,
  rollNumber: 'ST001', // Required for students
};
```

## Best Practices

### 1. Test One Thing
Each test should verify one specific behavior.

### 2. Use Descriptive Names
Test names should clearly describe what is being tested.

### 3. Follow AAA Pattern
Structure tests with Arrange, Act, Assert sections.

### 4. Keep Tests Independent
Tests should not depend on each other.

### 5. Use Realistic Data
Use Faker to generate realistic test data.

### 6. Clean Up
Always clean up test data after tests.

### 7. Mock External Dependencies
Mock email services, payment gateways, etc.

## Test Checklist

Before committing:
- [ ] All tests pass
- [ ] New features have tests
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] Tests are independent
- [ ] Test names are descriptive
- [ ] Coverage meets threshold
- [ ] No console errors

## Resources

- [Jest Documentation](https://jestjs.io/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Faker.js](https://fakerjs.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Next Steps

1. ✅ Complete unit tests for services
2. 📝 Run integration tests
3. ⏳ Add controller tests
4. ⏳ Add middleware tests
5. ⏳ Improve coverage to 80%+

---

**Last Updated**: 2025-01-06  
**Tests**: 35 passing  
**Coverage**: 8% overall, 60-70% for tested services