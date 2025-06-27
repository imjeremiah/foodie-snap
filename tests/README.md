# Tests Directory

This directory contains all test files and test-related scripts for the FoodieSnap application.

## Structure

```
tests/
├── integration/          # Integration tests for API endpoints and functions
│   ├── test_nutrition_scan.js     # Tests nutrition label scanning Edge Function
│   ├── test_content_sparks.js     # Tests content sparks generation
│   ├── test_database_functions.js # Tests database functions and connectivity
│   └── test_storage.js           # Tests file storage and upload functionality
└── scripts/              # Test utility scripts (future)
```

## Running Tests

### Individual Tests
```bash
# Test nutrition scanning functionality
npm run test:nutrition

# Test content sparks generation
npm run test:content-sparks

# Test database functions
npm run test:database

# Test storage functionality
npm run test:storage
```

### All Tests
```bash
# Run all integration tests
npm run test:all
```

## Prerequisites

Before running tests, ensure you have:

1. **Environment Variables**: A `.env.local` file in the project root with:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

2. **Test User**: The nutrition scan test will create a test user `test@foodiesnap.com` if it doesn't exist.

3. **Deployed Functions**: Edge functions should be deployed to Supabase:
   ```bash
   npm run functions:deploy
   ```

## Test Coverage

### Integration Tests
- ✅ **Nutrition Scanning**: Tests AI-powered nutrition label analysis
- ✅ **Content Sparks**: Tests weekly personalized content generation
- ✅ **Database Functions**: Tests RAG functions and data integrity
- ✅ **Storage**: Tests file upload and media storage

### Future Test Plans
- **Unit Tests**: Component and utility function tests
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load testing for AI functions
- **Visual Regression**: UI component testing

## Notes

- All integration tests require internet connectivity for API calls
- Tests create minimal test data and clean up after themselves
- Edge function tests may take 30-60 seconds due to cold starts
- Some tests require valid OpenAI API credits for AI functionality 