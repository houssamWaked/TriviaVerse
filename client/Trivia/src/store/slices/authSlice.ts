import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCurrentUser, setCurrentUser, type StoredUser } from '@/api/userStore';

type AuthState = {
  user: StoredUser;
};

const initialState: AuthState = {
  user: getCurrentUser(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<StoredUser>) {
      state.user = action.payload;
      setCurrentUser(action.payload);
    },
    clearAuthUser(state) {
      state.user = null;
      setCurrentUser(null);
    },
  },
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
