// Mock Firebase Admin
const mockCert = jest.fn();
const mockInitializeApp = jest.fn();

const mockAdmin = {
  apps: { length: 0 },
  initializeApp: mockInitializeApp,
  credential: {
    cert: mockCert,
  },
};

jest.mock('firebase-admin', () => ({
  default: mockAdmin,
}));

describe('Firebase Admin Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCert.mockReturnValue('mock-credential');
    mockInitializeApp.mockReturnValue(undefined);
    mockAdmin.apps.length = 0;
    // Reset environment variables
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_DATABASE_URL;
  });

  it('should initialize Firebase Admin with environment variables', () => {
    // Set environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key\\nwith-newlines';
    process.env.FIREBASE_DATABASE_URL = 'https://test.firebaseio.com';

    // Re-import the module to trigger initialization
    jest.resetModules();
    jest.isolateModules(() => {
      require('./firebase-admin.config');
    });

    expect(mockCert).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@test.com',
      privateKey: 'test-private-key\nwith-newlines',
    });
    expect(mockInitializeApp).toHaveBeenCalled();
  });

  it('should handle missing environment variables gracefully', async () => {
    // Re-import the module without environment variables
    jest.resetModules();
    await jest.isolateModulesAsync(async () => {
      const config = await import('./firebase-admin.config');
      expect(config.default).toBeDefined();
    });
  });

  it('should replace escaped newlines in private key', () => {
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2\\nline3';
    process.env.FIREBASE_DATABASE_URL = 'https://test.firebaseio.com';

    jest.resetModules();
    jest.isolateModules(() => {
      require('./firebase-admin.config');
    });

    expect(mockCert).toHaveBeenCalledWith(
      expect.objectContaining({
        privateKey: 'line1\nline2\nline3',
      }),
    );
  });

  it('should not initialize Firebase if already initialized', () => {
    // Mock Firebase as already initialized
    mockAdmin.apps.length = 1;

    jest.resetModules();
    jest.isolateModules(() => {
      require('./firebase-admin.config');
    });

    expect(mockInitializeApp).not.toHaveBeenCalled();
  });
});
