import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, graphqlPublicApi } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage } from '@/utils/apiError';

export type LeaderboardEntry = {
  user_id: string;
  rank_position: number;
  username?: string | null;
  level?: number | null;
  score_value: number | string;
};

type LeaderboardResponse = {
  entries?: LeaderboardEntry[];
};

type LeaderboardState = {
  period: string;
  mode: string;
  entries: LeaderboardEntry[];
  busy: boolean;
  error: string;
};

const initialState: LeaderboardState = {
  period: STRINGS.LEADERBOARD.periods.allTime,
  mode: STRINGS.LEADERBOARD.modes.global,
  entries: [],
  busy: false,
  error: '',
};

export const fetchLeaderboard = createAsyncThunk<
  LeaderboardEntry[],
  void,
  { state: { leaderboard: LeaderboardState }; rejectValue: string }
>('leaderboard/fetchLeaderboard', async (_arg, thunkApi) => {
  const { period, mode } = thunkApi.getState().leaderboard;

  try {
    let response: LeaderboardResponse | null;
    try {
      response = await graphqlPublicApi.getLeaderboard<LeaderboardResponse>(period, mode);
    } catch {
      response = (await api.getLeaderboard({ period, mode })) as LeaderboardResponse | null;
    }
    return Array.isArray(response?.entries) ? response.entries : [];
  } catch (error) {
    return thunkApi.rejectWithValue(getApiErrorMessage(error));
  }
});

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setPeriod(state, action: PayloadAction<string>) {
      state.period = action.payload;
    },
    setMode(state, action: PayloadAction<string>) {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.busy = true;
        state.error = '';
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.busy = false;
        state.entries = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.busy = false;
        state.error = action.payload || 'Failed to load leaderboard.';
      });
  },
});

export const { setPeriod, setMode } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
