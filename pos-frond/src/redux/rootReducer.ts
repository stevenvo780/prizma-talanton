import { combineReducers } from '@reduxjs/toolkit';
import auth from './auth';
import products from './products';
import ui from './ui';
import category from './category';


const rootReducer = combineReducers({
  auth,
  products,
  ui,
  category
});

export default rootReducer;
