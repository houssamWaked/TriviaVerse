import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, graphqlProfileApi } from '@/api';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ProfileData } from '@/features/Profile/types';

type ProfileState = {
  data: ProfileData | null;
  busy: boolean;
  error: string;
};

const initialState: ProfileState = {
  data: null,
  busy: false,
  error: '',
};

export const loadMyProfile = createAsyncThunk<
  ProfileData,
  void,
  { rejectValue: string }
>('profile/loadMyProfile', async (_arg, thunkApi) => {
  try {
    try {
      return await graphqlProfileApi.getMyProfile<ProfileData>();
    } catch {
      return (await api.getMyProfile()) as ProfileData;
    }
  } catch (error) {
    return thunkApi.rejectWithValue(getApiErrorMessage(error));
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.data = null;
      state.busy = false;
      state.error = '';
    },
    setProfileError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMyProfile.pending, (state) => {
        state.busy = true;
        state.error = '';
      })
      .addCase(loadMyProfile.fulfilled, (state, action) => {
        state.busy = false;
        state.data = action.payload;
      })
      .addCase(loadMyProfile.rejected, (state, action) => {
        state.busy = false;
        state.data = null;
        state.error = action.payload || 'Failed to load profile.';
      });
  },
});

export const { clearProfile, setProfileError } = profileSlice.actions;
export default profileSlice.reducer;
