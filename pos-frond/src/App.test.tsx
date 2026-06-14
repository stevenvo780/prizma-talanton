import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import uiReducer from './redux/ui';
import authReducer from './redux/auth';
import productsReducer from './redux/products';
import categoryReducer from './redux/category';

// Mock store para los tests
const createMockStore = () => configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    products: productsReducer,
    category: categoryReducer,
  },
  preloadedState: {
    ui: {
      loading: false,
      notifications: [],
      config: {
        iva: 0,
        withholdingTax: 0,
        initialConsecutive: 0,
        finalConsecutive: 0,
        pluginsConfig: {
          graf: { auth_token: '', enabled: false },
          meravuelta: { auth_token: '', enabled: false },
          fiar: { auth_token: '', enabled: false },
        },
      },
      cashBox: {
        cashIn: 0,
        cashOut: 0,
        balance: 0,
        name: '',
      },
      cashBoxes: [],
    },
    auth: {
      isLoggedIn: false,
      userData: null,
      access_token: null,
    },
    products: {
      products: [],
      selectedProduct: null,
    },
    category: {
      categories: [],
      selectedCategory: null,
    },
  },
});

test('renders app without crashing', () => {
  const store = createMockStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  // Verifica que el componente se renderice sin errores
  expect(document.body).toBeInTheDocument();
});
