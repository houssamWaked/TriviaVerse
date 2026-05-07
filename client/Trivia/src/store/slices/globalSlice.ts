import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type DuelToast = {
  count: number;
  challengerName: string;
  quizTitle: string;
} | null;

type GlobalState = {
  pendingDuelCount: number;
  duelToast: DuelToast;
};

const initialState: GlobalState = {
  pendingDuelCount: 0,
  duelToast: null,
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setPendingDuelCount(state, action: PayloadAction<number>) {
      state.pendingDuelCount = action.payload;
    },
    setDuelToast(state, action: PayloadAction<DuelToast>) {
      state.duelToast = action.payload;
    },
  },
});

export const { setPendingDuelCount, setDuelToast } = globalSlice.actions;
export default globalSlice.reducer;
