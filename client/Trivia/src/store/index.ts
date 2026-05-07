import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import discoverReducer from './slices/discoverSlice';
import globalReducer from './slices/globalSlice';
import leaderboardReducer from './slices/leaderboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    discover: discoverReducer,
    global: globalReducer,
    leaderboard: leaderboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
