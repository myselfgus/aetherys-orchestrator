import { create } from 'zustand';
import { SessionInfo } from 'worker/types';
import { chatService } from './chat';
export type Artifact = {
  type: 'code' | 'preview' | 'text' | null;
  language?: string;
  content: string;
};
interface AppState {
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isFileManagerOpen: boolean;
  isSettingsOpen: boolean;
  activeSessionId: string | null;
  sessions: SessionInfo[];
  artifact: Artifact;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
  toggleFileManager: () => void;
  toggleSettings: () => void;
  setActiveSessionId: (sessionId: string | null) => void;
  fetchSessions: () => Promise<void>;
  createNewSession: () => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  setArtifact: (artifact: Artifact) => void;
  clearArtifact: () => void;
}
export const useAppStore = create<AppState>((set, get) => ({
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  isFileManagerOpen: false,
  isSettingsOpen: false,
  activeSessionId: null,
  sessions: [],
  artifact: { type: null, content: '' },
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  openRightSidebar: () => set({ isRightSidebarOpen: true }),
  closeRightSidebar: () => set({ isRightSidebarOpen: false }),
  toggleFileManager: () => set(state => ({ isFileManagerOpen: !state.isFileManagerOpen })),
  toggleSettings: () => set(state => ({ isSettingsOpen: !state.isSettingsOpen })),
  setActiveSessionId: (sessionId) => {
    if (get().activeSessionId !== sessionId) {
      set({ activeSessionId: sessionId });
    }
  },
  fetchSessions: async () => {
    const res = await chatService.listSessions();
    if (res.success && res.data) {
      set({ sessions: res.data });
    }
  },
  createNewSession: async () => {
    const res = await chatService.createSession();
    if (res.success && res.data) {
      await get().fetchSessions();
      set({ activeSessionId: res.data.sessionId });
      return res.data.sessionId;
    }
    return null;
  },
  deleteSession: async (sessionId: string) => {
    const { activeSessionId, sessions } = get();
    await chatService.deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        set({ activeSessionId: remainingSessions[0].id });
      } else {
        await get().createNewSession();
      }
    }
    await get().fetchSessions();
  },
  renameSession: async (sessionId: string, newTitle: string) => {
    await chatService.updateSessionTitle(sessionId, newTitle);
    await get().fetchSessions();
  },
  setArtifact: (artifact) => set({ artifact, isRightSidebarOpen: true }),
  clearArtifact: () => set({ artifact: { type: null, content: '' }, isRightSidebarOpen: false }),
}));