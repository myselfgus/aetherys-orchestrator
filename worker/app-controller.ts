import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, MCPServerConfig } from './types';
import type { Env } from './core-utils';
// 🤖 AI Extension Point: Add session and MCP server management features
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private mcpServers = new Map<string, MCPServerConfig>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const stored = await this.ctx.storage.get<{ sessions: Record<string, SessionInfo>, mcpServers: Record<string, MCPServerConfig> }>('state') || { sessions: {}, mcpServers: {} };
      this.sessions = new Map(Object.entries(stored.sessions || {}));
      this.mcpServers = new Map(Object.entries(stored.mcpServers || {}));
      this.loaded = true;
    }
  }
  private async persist(): Promise<void> {
    await this.ctx.storage.put('state', {
      sessions: Object.fromEntries(this.sessions),
      mcpServers: Object.fromEntries(this.mcpServers)
    });
  }
  // Session Management
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persist();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persist();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persist();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persist();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async getSessionCount(): Promise<number> {
    await this.ensureLoaded();
    return this.sessions.size;
  }
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    await this.ensureLoaded();
    return this.sessions.get(sessionId) || null;
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persist();
    return count;
  }
  // MCP Server Management
  async addMCPServer(name: string, sseUrl: string): Promise<void> {
    await this.ensureLoaded();
    this.mcpServers.set(name, { name, sseUrl });
    await this.persist();
  }
  async removeMCPServer(name: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.mcpServers.delete(name);
    if (deleted) await this.persist();
    return deleted;
  }
  async listMCPServers(): Promise<MCPServerConfig[]> {
    await this.ensureLoaded();
    return Array.from(this.mcpServers.values());
  }
}