import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, graphqlPublicApi } from '@/api';
import { getApiErrorMessage } from '@/utils/apiError';
import type { DiscoverQuiz } from '@/features/DiscoverQuizzes/types';

type DiscoverResponse = {
  results?: DiscoverQuiz[];
};

type DiscoverState = {
  q: string;
  results: DiscoverQuiz[];
  busy: boolean;
  error: string;
};

const initialState: DiscoverState = {
  q: '',
  results: [],
  busy: false,
  error: '',
};

export const loadTopQuizzes = createAsyncThunk<
  DiscoverQuiz[],
  void,
  { rejectValue: string }
>('discover/loadTopQuizzes', async (_arg, thunkApi) => {
  try {
    let response: DiscoverResponse;
    try {
      response = await graphqlPublicApi.getTopQuizzes<DiscoverResponse>(20);
    } catch {
      response = (await api.getTopQuizzes(20)) as DiscoverResponse;
    }
    return Array.isArray(response?.results) ? response.results : [];
  } catch (error) {
    return thunkApi.rejectWithValue(getApiErrorMessage(error));
  }
});

export const searchQuizzes = createAsyncThunk<
  DiscoverQuiz[],
  string,
  { rejectValue: string }
>('discover/searchQuizzes', async (query, thunkApi) => {
  const term = String(query || '').trim();
  if (!term) {
    return thunkApi.dispatch(loadTopQuizzes()).unwrap();
  }

  try {
    let response: DiscoverResponse;
    try {
      response = await graphqlPublicApi.searchQuizzes<DiscoverResponse>(term, 30);
    } catch {
      response = (await api.searchQuizzes(term, 30)) as DiscoverResponse;
    }
    return Array.isArray(response?.results) ? response.results : [];
  } catch (error) {
    return thunkApi.rejectWithValue(getApiErrorMessage(error));
  }
});

const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.q = action.payload;
    },
  },
  extraReducers: (builder) => {
    const setPending = (state: DiscoverState) => {
      state.busy = true;
      state.error = '';
    };
    const setRejected = (state: DiscoverState, action: { payload?: string }) => {
      state.busy = false;
      state.error = action.payload || 'Failed to load quizzes.';
    };

    builder
      .addCase(loadTopQuizzes.pending, setPending)
      .addCase(loadTopQuizzes.fulfilled, (state, action) => {
        state.busy = false;
        state.results = action.payload;
      })
      .addCase(loadTopQuizzes.rejected, setRejected)
      .addCase(searchQuizzes.pending, setPending)
      .addCase(searchQuizzes.fulfilled, (state, action) => {
        state.busy = false;
        state.results = action.payload;
      })
      .addCase(searchQuizzes.rejected, setRejected);
  },
});

export const { setQuery } = discoverSlice.actions;
export default discoverSlice.reducer;
