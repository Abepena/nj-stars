# Testing Guide - NJ Stars Platform

Comprehensive testing documentation for the NJ Stars Basketball platform with industry-standard code coverage.

## Table of Contents

- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)

## Overview

The NJ Stars platform implements comprehensive testing across both frontend and backend to ensure code quality, reliability, and maintainability.

### Testing Stack

**Backend:**
- pytest - Testing framework
- pytest-cov - Code coverage
- pytest-asyncio - Async test support
- httpx - HTTP client for API testing
- faker - Mock data generation

**Frontend:**
- Jest - Testing framework
- React Testing Library - Component testing
- @testing-library/user-event - User interaction testing
- @testing-library/jest-dom - DOM matchers

### Coverage Goals

- **Overall Coverage:** 80%+
- **Critical Paths:** 90%+
- **Branches:** 70%+
- **Functions:** 70%+

---

## Backend Testing

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run tests:**
   ```bash
   # Run all tests
   pytest

   # Run with coverage report
   pytest --cov=app --cov-report=html

   # Run specific test file
   pytest tests/unit/test_models.py

   # Run specific test
   pytest tests/unit/test_models.py::TestUserModel::test_create_user_with_credentials
   ```

### Test Structure

```
backend/tests/
├── conftest.py              # Shared fixtures and configuration
├── unit/                    # Unit tests
│   ├── test_models.py      # Database model tests
│   └── test_instagram_service.py  # Service layer tests
└── integration/             # Integration tests
    ├── test_blog_routes.py
    ├── test_product_routes.py
    ├── test_event_routes.py
    └── test_stripe_routes.py
```

### Available Fixtures

**Database Fixtures:**
- `db` - Fresh database session for each test
- `client` - FastAPI test client

**User Fixtures:**
- `admin_user` - Admin user
- `parent_user` - Parent user
- `player_user` - Player user
- `oauth_user` - OAuth authenticated user

**Data Fixtures:**
- `sample_blog_post`, `multiple_blog_posts`
- `sample_product`, `multiple_products`, `out_of_stock_product`
- `sample_event`, `multiple_events`
- `sample_order`, `completed_order`

**Mock Fixtures:**
- `mock_stripe_session` - Mock Stripe checkout session
- `mock_stripe_event` - Mock Stripe webhook event

### Test Markers

Use pytest markers to categorize tests:

```python
@pytest.mark.unit  # Unit tests
@pytest.mark.integration  # Integration tests
@pytest.mark.slow  # Slow running tests
@pytest.mark.stripe  # Stripe-related tests
@pytest.mark.instagram  # Instagram API tests
```

Run specific markers:
```bash
pytest -m unit  # Run only unit tests
pytest -m "not slow"  # Skip slow tests
```

### Example Tests

**Unit Test Example:**
```python
@pytest.mark.unit
def test_create_product(db: Session):
    """Test creating a product"""
    product = Product(
        name="Test Jersey",
        price=59.99,
        stock_quantity=50,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    assert product.id is not None
    assert product.price == 59.99
```

**Integration Test Example:**
```python
@pytest.mark.integration
def test_get_products(client: TestClient, sample_product: Product):
    """Test getting all products"""
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
```

---

## Frontend Testing

### Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run tests:**
   ```bash
   # Run all tests
   npm test

   # Run in watch mode
   npm run test:watch

   # Run with coverage
   npm run test:coverage
   ```

### Test Structure

```
frontend/src/__tests__/
├── utils/
│   └── test-utils.tsx      # Test utilities and custom render
├── components/
│   ├── button.test.tsx
│   ├── card.test.tsx
│   ├── news-feed.test.tsx
│   └── checkout-button.test.tsx
└── pages/
    ├── shop.test.tsx
    └── portal-dashboard.test.tsx
```

### Test Utilities

Custom render with providers:

```typescript
import { render, mockSession } from '@/__tests__/utils/test-utils'

test('example', () => {
  render(<MyComponent />, { session: mockSession })
})
```

Available mocks:
- `mockSession` - Regular user session
- `mockAdminSession` - Admin user session

### Writing Component Tests

**Component Test Example:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Page Test Example:**
```typescript
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import ShopPage from '@/app/shop/page'

describe('Shop Page', () => {
  it('displays products after loading', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Jersey')).toBeInTheDocument()
    })
  })
})
```

### Best Practices

1. **Use Testing Library queries by priority:**
   - `getByRole` (preferred)
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (last resort)

2. **Test user behavior, not implementation:**
   ```typescript
   // ✅ Good
   await user.click(screen.getByRole('button', { name: /submit/i }))

   // ❌ Bad
   fireEvent.click(submitButton)
   ```

3. **Use `waitFor` for async operations:**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

4. **Mock external dependencies:**
   ```typescript
   global.fetch = jest.fn()
   // or
   jest.mock('next/navigation')
   ```

---

## Coverage Requirements

### Backend Coverage

Current thresholds (pytest.ini):
```ini
--cov-fail-under=80
```

View coverage:
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Frontend Coverage

Current thresholds (jest.config.js):
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 80,
    statements: 80,
  },
}
```

View coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Reports

Both frontend and backend generate:
- **HTML reports** - Interactive browseable coverage
- **Terminal output** - Quick coverage summary
- **XML reports** - For CI/CD integration

---

## Running Tests

### Quick Start

**Backend:**
```bash
cd backend
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest -x                 # Stop on first failure
pytest --lf               # Run last failed tests
```

**Frontend:**
```bash
cd frontend
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Run Specific Tests

**Backend:**
```bash
# By file
pytest tests/unit/test_models.py

# By test name
pytest -k "test_create_user"

# By marker
pytest -m integration
```

**Frontend:**
```bash
# By pattern
npm test -- button

# By file
npm test -- src/__tests__/components/button.test.tsx

# Update snapshots
npm test -- -u
```

### Debug Tests

**Backend:**
```bash
# With print statements
pytest -s

# With debugger
pytest --pdb
```

**Frontend:**
```bash
# With console output
npm test -- --verbose

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Writing Tests

### Test Naming Conventions

**Backend:**
- File: `test_<module>.py`
- Class: `Test<Feature>`
- Function: `test_<action>_<expected_result>`

Example:
```python
class TestProductRoutes:
    def test_get_products_returns_active_only(self):
        ...
```

**Frontend:**
- File: `<component>.test.tsx`
- Describe: `<Component> Component`
- Test: Clear description of behavior

Example:
```typescript
describe('Button Component', () => {
  it('disables button when loading', () => {
    ...
  })
})
```

### Test Coverage Checklist

For each feature, ensure tests cover:

- ✅ **Happy path** - Feature works as expected
- ✅ **Error cases** - Handles errors gracefully
- ✅ **Edge cases** - Boundary conditions
- ✅ **User interactions** - Clicks, inputs, navigation
- ✅ **Loading states** - Async operations
- ✅ **Validation** - Input validation and sanitization
- ✅ **Permissions** - Role-based access control

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "Running backend tests..."
cd backend && pytest -x || exit 1

echo "Running frontend tests..."
cd frontend && npm test -- --bail || exit 1

echo "✅ All tests passed!"
```

---

## Troubleshooting

### Common Issues

**Backend:**

1. **Import errors:**
   ```bash
   # Ensure you're in the backend directory
   cd backend
   export PYTHONPATH=$PWD
   pytest
   ```

2. **Database connection errors:**
   - Tests use in-memory SQLite, no PostgreSQL needed
   - Check conftest.py is present

**Frontend:**

1. **Module not found:**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   ```

2. **Async test timeouts:**
   ```typescript
   // Increase timeout
   jest.setTimeout(10000)
   ```

3. **Mock not working:**
   ```typescript
   // Reset mocks between tests
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

---

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Continuous Improvement

### Adding New Tests

1. Identify untested code (check coverage reports)
2. Write tests following established patterns
3. Run tests locally
4. Ensure coverage thresholds are met
5. Submit with pull request

### Maintaining Tests

- Update tests when features change
- Remove tests for deprecated features
- Keep test data realistic and current
- Review and refactor slow tests

---

**Happy Testing! 🧪**
