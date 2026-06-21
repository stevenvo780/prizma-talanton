import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { Config, CashBox, ConfigPlugins } from '../utils/types';

interface Notification {
  id?: string;
  color?: string;
  message: string;
}

interface State {
  loading: boolean;
  notifications: Notification[],
  config: Config,
  cashBox: CashBox,
  cashBoxes: CashBox[],
}

const defaultPluginsConfig: ConfigPlugins = {
  hermes: { auth_token: '', enabled: false },
  talaria: { auth_token: '', enabled: false },
  pistis: { auth_token: '', enabled: false },
};

const initialState: State = {
  loading: false,
  notifications: [],
  config: {
    iva: 0,
    withholdingTax: 0,
    initialConsecutive: 0,
    finalConsecutive: 0,
    pluginsConfig: defaultPluginsConfig
  },
  cashBox: {
    cashIn: 0,
    cashOut: 0,
    balance: 0,
    name: '',
  },
  cashBoxes: [],
};

const ui = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push({
        id: uuid(),
        message: action.payload.message,
        color: action.payload.color
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    setConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
    },
    getCashBox(state, action: PayloadAction<CashBox[]>) {
      state.cashBoxes = action.payload;
    },
    setCashBox(state, action: PayloadAction<CashBox>) {
      state.cashBox = action.payload;
    },
  },
});

export const {
  loading,
  addNotification,
  removeNotification,
  setConfig,
  setCashBox,
  getCashBox
} = ui.actions;

export default ui.reducer;
