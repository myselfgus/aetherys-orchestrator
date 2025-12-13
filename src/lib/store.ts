import { create } from 'zustand';
export type Artifact = {
  type: 'code' | 'preview' | 'text' | null;
  language?: string;
  content: string;
};
interface AppState {
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  activeSessionId: string | null;
  artifact: Artifact;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
  setActiveSessionId: (sessionId: string | null) => void;
  setArtifact: (artifact: Artifact) => void;
  clearArtifact: () => void;
}
export const useAppStore = create<AppState>((set) => ({
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  activeSessionId: null,
  artifact: { type: null, content: '' },
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  openRightSidebar: () => set({ isRightSidebarOpen: true }),
  closeRightSidebar: () => set({ isRightSidebarOpen: false }),
  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
  setArtifact: (artifact) => set({ artifact, isRightSidebarOpen: true }),
  clearArtifact: () => set({ artifact: { type: null, content: '' }, isRightSidebarOpen: false }),
}));