# Complete Testing Guide for CampusPass

This comprehensive guide covers all testing aspects of the CampusPass application, from unit tests to E2E tests.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [E2E Testing](#e2e-testing)
5. [CI/CD Integration](#cicd-integration)
6. [Running Tests](#running-tests)
7. [Coverage Reports](#coverage-reports)
8. [Best Practices](#best-practices)

---

## Testing Overview

### Testing Stack

**Backend:**
- **Framework:** Jest
- **Database:** MongoDB Memory Server
- **HTTP Testing:** Fastify inject
- **Mocking:** Vitest mocking utilities
- **Test Data:** Faker.js

**Frontend:**
- **Framework:** Vitest
- **Component Testing:** React Testing Library
- **DOM Environment:** jsdom
- **Mocking:** Vitest mocking utilities

**E2E:**
- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile Testing:** Pixel 5, iPhone 12

### Test Coverage Goals

- **Backend:** 80%+ coverage
- **Frontend:** 70%+ coverage
- **E2E:** Critical user flows
- **Overall:** 75%+ combined coverage

---

## Backend Testing

### Test Structure

```
backend/src/__tests__/
├── unit/                    # Unit tests
│   ├── auth.service.test.ts
│   ├── outpass.service.test.ts
│   ├── auth.controller.test.ts
│   └── middleware.test.ts
├── integration/             # Integration tests
│   ├── auth.routes.test.ts
│   ├── outpass.routes.test.ts
│   └── security.routes.test.ts
└── helpers/                 # Test utilities
    └── setup.ts
```

### Unit Tests (35 tests)

**auth.service.test.ts** - 20 tests
- User registration with password hashing
- Duplicate email/roll number validation
- Login with valid/invalid credentials
- Inactive user handling
- Profile operations
- Password management
- User activation/deactivation
- User listing and filtering

**outpass.service.test.ts** - 15 tests
- Outpass creation with validation
- Date validation (past dates, invalid ranges)
- Overlapping outpass detection
- Approval/rejection workflow
- Check-out/check-in operations
- Overdue detection
- Student statistics

### Integration Tests (67+ tests)

**auth.routes.test.ts** - 40+ tests
- POST /api/auth/register (student, warden, validation)
- POST /api/auth/login (credentials, errors)
- GET /api/auth/me (token validation)
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/logout

**outpass.routes.test.ts** - 15+ tests
- POST /api/student/outpass (creation, validation)
- GET /api/student/outpass (filtering, pagination)
- PATCH /api/warden/outpass/:id/approve
- PATCH /api/warden/outpass/:id/reject
- GET /api/warden/dashboard
- GET /api/warden/students

**security.routes.test.ts** - 12+ tests
- GET /api/security/dashboard
- PATCH /api/security/outpass/:id/checkout
- PATCH /api/security/outpass/:id/checkin
- GET /api/security/outpass/active
- GET /api/security/outpass/overdue
- POST /api/security/outpass/scan
- GET /api/security/history

### Running Backend Tests

```bash
# Run all tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test auth.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

### Backend Test Examples

**Unit Test Example:**
```typescript
it('should create user with hashed password', async () => {
  // ARRANGE
  const userData = {
    name: 'John Doe',
    email: 'john@test.com',
    password: 'Test@123',
    role: UserRole.STUDENT,
  };

  // ACT
  const user = await authService.register(userData);

  // ASSERT
  expect(user).toBeDefined();
  expect(user.password).not.toBe('Test@123');
  expect(await bcrypt.compare('Test@123', user.password)).toBe(true);
});
```

**Integration Test Example:**
```typescript
it('should create outpass for authenticated student', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/api/student/outpass',
    headers: {
      authorization: `Bearer ${studentToken}`,
    },
    payload: outpassData,
  });

  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body).success).toBe(true);
});
```

---

## Frontend Testing

### Test Structure

```
frontend/src/__tests__/
├── components/              # Component tests
│   ├── Button.test.tsx
│   └── OutpassCard.test.tsx
├── hooks/                   # Custom hook tests
│   └── useAuth.test.tsx
└── setup.ts                 # Test setup
```

### Component Tests

**Button.test.tsx** - 40+ tests
- Rendering with different variants
- Size variations (sm, md, lg)
- States (disabled, loading, fullWidth)
- Click interactions
- Custom props and className
- Accessibility (ARIA labels, roles)

**OutpassCard.test.tsx** - 50+ tests
- Outpass details rendering
- Status badges (pending, approved, rejected)
- Actions (cancel, view details)
- QR code display
- Warden information
- Overdue warnings
- Accessibility

### Hook Tests

**useAuth.test.tsx** - 30+ tests
- Initial state
- Login/logout operations
- Registration
- Profile updates
- Password changes
- Token refresh
- Role checks (student, warden, security)
- Error handling

### Running Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test Button.test.tsx

# Run with UI
npm run test:ui
```

### Frontend Test Examples

**Component Test:**
```typescript
it('should call onClick handler when clicked', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Hook Test:**
```typescript
it('should login successfully with valid credentials', async () => {
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.login('john@test.com', 'password123');
  });

  expect(result.current.user).toBeDefined();
  expect(result.current.isAuthenticated).toBe(true);
});
```

---

## E2E Testing

### Test Structure

```
frontend/e2e/
├── auth.spec.ts             # Authentication flows
└── outpass-workflow.spec.ts # Complete outpass lifecycle
```

### E2E Test Coverage

**auth.spec.ts** - 20+ scenarios
- Login page display and validation
- Successful login with different roles
- Registration (student, warden, security)
- Password validation and confirmation
- Forgot password flow
- Logout and session clearing
- Protected route access
- Session persistence

**outpass-workflow.spec.ts** - 4 complete workflows
- Full lifecycle (create → approve → checkout → checkin)
- Rejection workflow
- Cancellation by student
- Overdue detection

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
cd frontend
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e auth.spec.ts

# Run in debug mode
npm run test:e2e -- --debug

# Generate HTML report
npx playwright show-report
```

### E2E Test Example

```typescript
test('should complete full outpass lifecycle', async ({ browser }) => {
  const studentContext = await browser.newContext();
  const wardenContext = await browser.newContext();
  const securityContext = await browser.newContext();

  // Student creates outpass
  await studentPage.getByLabel(/reason/i).fill('Medical appointment');
  await studentPage.getByRole('button', { name: /submit/i }).click();

  // Warden approves
  await wardenPage.getByRole('button', { name: /approve/i }).click();

  // Security checks out
  await securityPage.getByRole('button', { name: /check out/i }).click();

  // Security checks in
  await securityPage.getByRole('button', { name: /check in/i }).click();
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline (`.github/workflows/ci-cd.yml`):

**Jobs:**
1. **backend-test** - Run backend tests with MongoDB
2. **frontend-test** - Run frontend unit tests
3. **e2e-test** - Run Playwright E2E tests
4. **backend-build** - Build backend TypeScript
5. **frontend-build** - Build frontend with Vite
6. **deploy-backend** - Deploy to Railway (main branch)
7. **deploy-frontend** - Deploy to Vercel (main branch)
8. **security-scan** - Run Snyk security scan
9. **code-quality** - SonarCloud analysis
10. **notify** - Send Slack notifications

### Required Secrets

Add these to GitHub repository secrets:
- `RAILWAY_TOKEN` - Railway deployment token
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `SNYK_TOKEN` - Snyk security token
- `SONAR_TOKEN` - SonarCloud token
- `SLACK_WEBHOOK` - Slack webhook URL

---

## Running Tests

### Quick Start

```bash
# Backend tests
cd backend
npm install
npm test

# Frontend tests
cd frontend
npm install
npm test

# E2E tests
cd frontend
npx playwright install
npm run test:e2e
```

### All Tests at Once

```bash
# From project root
npm run test:all
```

### Watch Mode (Development)

```bash
# Backend watch mode
cd backend
npm run test:watch

# Frontend watch mode
cd frontend
npm run test:watch
```

---

## Coverage Reports

### Viewing Coverage

**Backend:**
```bash
cd backend
npm run test:coverage
open coverage/lcov-report/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
open coverage/index.html
```

### Coverage Thresholds

**Backend (jest.config.js):**
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

**Frontend (vitest.config.ts):**
```typescript
coverage: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
}
```

### Current Coverage Status

**Backend:**
- AuthService: 70%
- OutpassService: 57%
- Controllers: 65%
- Routes: 80%

**Frontend:**
- Components: 60%
- Hooks: 55%
- Services: 50%

**Target:** 80%+ for all modules

---

## Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
it('should do something', async () => {
  // ARRANGE - Set up test data
  const userData = { name: 'John', email: 'john@test.com' };

  // ACT - Execute the function
  const result = await service.create(userData);

  // ASSERT - Verify the result
  expect(result).toBeDefined();
  expect(result.name).toBe('John');
});
```

### 2. Test Independence

- Each test should be independent
- Clean up after each test
- Don't rely on test execution order
- Use `beforeEach` for setup

### 3. Descriptive Test Names

```typescript
// ✅ Good
it('should return 401 when token is missing')

// ❌ Bad
it('test login')
```

### 4. Test One Thing

```typescript
// ✅ Good - Tests one specific behavior
it('should hash password before saving')

// ❌ Bad - Tests multiple things
it('should create user and send email and log event')
```

### 5. Use Test Data Generators

```typescript
import { faker } from '@faker-js/faker';

const mockUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
};
```

### 6. Mock External Dependencies

```typescript
vi.mock('../../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));
```

### 7. Test Error Cases

```typescript
it('should throw error for invalid email', async () => {
  await expect(
    service.register({ email: 'invalid' })
  ).rejects.toThrow('Invalid email');
});
```

### 8. Accessibility Testing

```typescript
it('should have proper ARIA labels', () => {
  render(<Button aria-label="Close">X</Button>);
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
});
```

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 30000
```

**2. ESM Module Errors**
```bash
# Use custom faker mock in setup.ts
```

**3. Port Already in Use**
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
```

**4. Playwright Browser Not Found**
```bash
# Reinstall browsers
npx playwright install --with-deps
```

---

## Summary

### Test Statistics

- **Total Tests:** 200+
- **Backend Unit Tests:** 35
- **Backend Integration Tests:** 67+
- **Frontend Component Tests:** 90+
- **Frontend Hook Tests:** 30+
- **E2E Tests:** 24+

### Commands Reference

```bash
# Backend
npm test                    # Run all tests
npm run test:coverage       # With coverage
npm run test:watch          # Watch mode

# Frontend
npm test                    # Run all tests
npm run test:coverage       # With coverage
npm run test:ui             # UI mode
npm run test:e2e            # E2E tests

# CI/CD
git push                    # Triggers pipeline
```

### Next Steps

1. Install testing dependencies (if not already done)
2. Run tests to verify setup
3. Review coverage reports
4. Add more tests for uncovered code
5. Set up CI/CD with GitHub Actions
6. Configure deployment secrets
7. Monitor test results in CI/CD

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated:** 2024-01-06
**Version:** 1.0.0
**Status:** Complete ✅