import { configureStore } from "@reduxjs/toolkit";
import dataReducer from "./data/data.slice";

export const store = configureStore({
  reducer: {
    data: dataReducer,
  },
});
