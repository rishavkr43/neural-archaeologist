import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  // Set user and token
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Current investigation state
  currentInvestigation: null,
  investigationLogs: [],
  investigationStatus: 'idle', // idle, loading, processing, completed, failed

  // Set current investigation
  setCurrentInvestigation: (investigation) =>
    set({ currentInvestigation: investigation }),

  // Update investigation status
  setInvestigationStatus: (status) =>
    set({ investigationStatus: status }),

  // Add agent log message
  addAgentLog: (log) =>
    set((state) => ({
      investigationLogs: [...state.investigationLogs, log],
    })),

  // Clear logs
  clearLogs: () =>
    set({ investigationLogs: [] }),

  // Update confidence
  updateConfidence: (confidence) =>
    set((state) => ({
      currentInvestigation: {
        ...state.currentInvestigation,
        confidence,
      },
    })),

  // Reset investigation state
  resetInvestigation: () =>
    set({
      currentInvestigation: null,
      investigationLogs: [],
      investigationStatus: 'idle',
    }),

  // Investigations list
  investigations: [],
  setInvestigations: (investigations) =>
    set({ investigations }),
}));

export default useStore;