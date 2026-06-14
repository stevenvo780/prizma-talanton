import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../utils/types';

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    getProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
    },
    getProduct(state, action: PayloadAction<Product>) {
      state.selectedProduct = action.payload;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.push(action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.products.findIndex(product => product.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    deleteProduct(state, action: PayloadAction<number>) {
      state.products = state.products.filter(product => product.id !== action.payload);
    },
  },
});

export const { getProducts, getProduct, addProduct, updateProduct, deleteProduct } = productSlice.actions;

export default productSlice.reducer;
