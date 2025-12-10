/**
 * Test user credentials and data
 * These should match your test database setup
 */
export const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "TestPassword123!",
    role: "admin",
    name: "Admin User",
  },
  trainer: {
    email: "trainer@test.com",
    password: "TestPassword123!",
    role: "trainer",
    name: "Trainer User",
  },
  client: {
    email: "client@test.com",
    password: "TestPassword123!",
    role: "client",
    name: "Client User",
  },
} as const;

/**
 * Test exercise data
 */
export const testExercise = {
  name: "Test Exercise",
  description: "This is a test exercise for E2E testing",
  category: "Strength",
  vimeoUrl: "https://vimeo.com/123456789",
};

/**
 * Test plan data
 */
export const testPlan = {
  name: "Test Training Plan",
  description: "This is a test training plan for E2E testing",
  duration: 4, // weeks
};

/**
 * Invalid credentials for negative testing
 */
export const invalidCredentials = {
  email: "nonexistent@test.com",
  password: "WrongPassword123!",
};
