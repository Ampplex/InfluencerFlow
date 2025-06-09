import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  user_type: 'brand' | 'influencer' | null;
}

const initialState: UserState = {
  user_type: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserType: (state, action: PayloadAction<'brand' | 'influencer'>) => {
      state.user_type = action.payload;
    },
    clearUserType: (state) => {
      state.user_type = null;
    },
  },
});

export const { setUserType, clearUserType } = userSlice.actions;
export default userSlice.reducer; 