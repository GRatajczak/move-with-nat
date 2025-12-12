const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env.test. Please check .env.test.example.`);
  }
  return value;
};

const credentials = {
  password: requiredEnv("E2E_PASSWORD"),
  adminEmail: requiredEnv("E2E_USERNAME_ADMIN"),
  trainerEmail: requiredEnv("E2E_USERNAME_TRAINER"),
  clientEmail: requiredEnv("E2E_USERNAME_CLIENT"),
  adminId: requiredEnv("E2E_USERNAME_ID_ADMIN"),
  trainerId: requiredEnv("E2E_USERNAME_ID_TRAINER"),
  clientId: requiredEnv("E2E_USERNAME_ID_CLIENT"),
};

/**
 * Test user credentials and data
 * Populated from .env.test to keep secrets out of source
 */
export const testUsers = {
  admin: {
    id: credentials.adminId,
    email: credentials.adminEmail,
    password: credentials.password,
    role: "admin",
    name: "Admin User",
  },
  trainer: {
    id: credentials.trainerId,
    email: credentials.trainerEmail,
    password: credentials.password,
    role: "trainer",
    name: "Trainer User",
  },
  client: {
    id: credentials.clientId,
    email: credentials.clientEmail,
    password: credentials.password,
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
