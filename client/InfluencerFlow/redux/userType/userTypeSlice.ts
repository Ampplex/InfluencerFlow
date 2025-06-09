// src/redux/userType/userTypeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserType = 'brand' | 'influencer' | null;

interface UserTypeState {
  type: UserType;
}

const initialState: UserTypeState = {
  type: null,
};

const userTypeSlice = createSlice({
  name: 'userType',
  initialState,
  reducers: {
    setUserType: (state, action: PayloadAction<UserType>) => {
      state.type = action.payload;
    },
    clearUserType: (state) => {
      state.type = null;
    },
  },
});

export const { setUserType, clearUserType } = userTypeSlice.actions;
export default userTypeSlice.reducer;