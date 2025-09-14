import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import projectsSlice from './slices/projectsSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date objects and auth tokens
        ignoredActions: [
          'projects/setProjects', 
          'projects/setCurrentProject',
          'auth/initializeAuth/fulfilled',
          'auth/loginUser/fulfilled',
          'auth/registerUser/fulfilled'
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.createdAt', 
          'payload.updatedAt',
          'payload.token',
          'payload.refreshToken'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'projects.items.createdAt', 
          'projects.currentProject.createdAt',
          'auth.user.createdAt'
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;