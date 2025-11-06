// Simple faker mock for testing
export const faker = {
  person: {
    fullName: () => `Test User ${Math.random().toString(36).substring(7)}`,
  },
  internet: {
    email: () => `test${Math.random().toString(36).substring(7)}@example.com`,
  },
  lorem: {
    sentence: () => 'Test sentence for testing purposes',
  },
  location: {
    city: () => 'Test City',
  },
  string: {
    alphanumeric: (length: number) => Math.random().toString(36).substring(2, 2 + length),
  },
};

// 
