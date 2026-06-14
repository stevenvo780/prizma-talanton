import '@testing-library/jest-dom';
import React from 'react';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

// Mock Firebase compat
jest.mock('firebase/compat/app', () => ({
  __esModule: true,
  default: {
    apps: [],
    initializeApp: jest.fn(),
    app: jest.fn(),
    auth: jest.fn(() => ({
      onAuthStateChanged: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      currentUser: null,
    })),
    firestore: jest.fn(() => ({
      collection: jest.fn(),
      doc: jest.fn(),
      batch: jest.fn(),
    })),
    storage: jest.fn(() => ({
      ref: jest.fn(),
    })),
  },
}));

jest.mock('firebase/compat/auth', () => ({}));
jest.mock('firebase/compat/firestore', () => ({}));
jest.mock('firebase/compat/storage', () => ({}));

const mockBrowserRouter = ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-router' }, children);
const mockRoutes = ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-routes' }, children);
const mockRoute = ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-route' }, children);

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: mockBrowserRouter,
  Routes: mockRoutes,
  Route: mockRoute,
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}));
