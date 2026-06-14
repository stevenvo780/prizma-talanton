import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../utils/types';

interface CategoryState {
  categories: Category[];
  selectedCategory: Category | null;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    getCategories(state, action: PayloadAction<Category[]>) {
      state.categories = action.payload;
    },
    getCategory(state, action: PayloadAction<Category>) {
      state.selectedCategory = action.payload;
    },
    addCategory(state, action: PayloadAction<Category>) {
      state.categories.push(action.payload);
    },
    updateCategory(state, action: PayloadAction<Category>) {
      const index = state.categories.findIndex(category => category.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory(state, action: PayloadAction<number>) {
      state.categories = state.categories.filter(category => category.id !== action.payload);
    },
  },
});

export const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory
} = categorySlice.actions;

export default categorySlice.reducer;
