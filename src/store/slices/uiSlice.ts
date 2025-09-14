import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  showCreateProjectModal: boolean;
  showCreateTaskModal: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UiState = {
  showCreateProjectModal: false,
  showCreateTaskModal: false,
  sidebarCollapsed: false,
  theme: 'system',
  notifications: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowCreateProjectModal: (state, action: PayloadAction<boolean>) => {
      state.showCreateProjectModal = action.payload;
    },
    setShowCreateTaskModal: (state, action: PayloadAction<boolean>) => {
      state.showCreateTaskModal = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// Action creators
export const {
  setShowCreateProjectModal,
  setShowCreateTaskModal,
  setSidebarCollapsed,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

// Selectors
export const selectShowCreateProjectModal = (state: { ui: UiState }) => state.ui.showCreateProjectModal;
export const selectShowCreateTaskModal = (state: { ui: UiState }) => state.ui.showCreateTaskModal;
export const selectSidebarCollapsed = (state: { ui: UiState }) => state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UiState }) => state.ui.theme;
export const selectNotifications = (state: { ui: UiState }) => state.ui.notifications;

export default uiSlice.reducer;