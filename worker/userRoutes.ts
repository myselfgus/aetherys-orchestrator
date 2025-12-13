import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
/**
 * Production Hardening Middleware
 * Applies secure headers and caching policies to relevant requests.
 */
const productionMiddleware = async (c: any, next: any) => {
    // Apply security headers to all responses
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // A strict CSP for our Vite-built SPA. Allows inline styles for UI components.
    c.res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self';");
    // Apply specific caching rules for API routes
    if (c.req.path.startsWith('/api/')) {
        c.res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    await next();
};
/**
 * DO NOT MODIFY THIS FUNCTION. Only for your reference.
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // Use this API for conversations. **DO NOT MODIFY**
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
        const sessionId = c.req.param('sessionId');
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId); // Get existing agent or create a new one if it doesn't exist, with sessionId as the name
        const url = new URL(c.req.url);
        url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
        return agent.fetch(new Request(url.toString(), {
            method: c.req.method,
            headers: c.req.header(),
            body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
        }));
        } catch (error) {
        console.error(JSON.stringify({
            level: 'error',
            message: 'Agent routing error',
            error: error instanceof Error ? error.message : String(error),
            url: c.req.url,
            method: c.req.method,
            sessionId: c.req.param('sessionId')
        }));
        return c.json({
            success: false,
            error: API_RESPONSES.AGENT_ROUTING_FAILED
        }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Apply production hardening middleware to all user routes
    app.use('*', productionMiddleware);
    // Add your routes here
    /**
     * List all chat sessions
     * GET /api/sessions
     */
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to list sessions',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method
            }));
            return c.json({
                success: false,
                error: 'Failed to retrieve sessions'
            }, { status: 500 });
        }
    });
    /**
     * Create a new chat session
     * POST /api/sessions
     * Body: { title?: string, sessionId?: string }
     */
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            // Generate better session titles
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleString([], {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    const truncated = cleanMessage.length > 40
                        ? cleanMessage.slice(0, 37) + '...'
                        : cleanMessage;
                    sessionTitle = `${truncated} �� ${dateTime}`;
                } else {
                    sessionTitle = `Chat ${dateTime}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({
                success: true,
                data: { sessionId, title: sessionTitle }
            });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to create session',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method
            }));
            return c.json({
                success: false,
                error: 'Failed to create session'
            }, { status: 500 });
        }
    });
    /**
     * Delete a chat session
     * DELETE /api/sessions/:sessionId
     */
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) {
                return c.json({
                    success: false,
                    error: 'Session not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to delete session',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method,
                sessionId: c.req.param('sessionId')
            }));
            return c.json({
                success: false,
                error: 'Failed to delete session'
            }, { status: 500 });
        }
    });
    /**
     * Update session title
     * PUT /api/sessions/:sessionId/title
     * Body: { title: string }
     */
    app.put('/api/sessions/:sessionId/title', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const { title } = await c.req.json();
            if (!title || typeof title !== 'string') {
                return c.json({
                    success: false,
                    error: 'Title is required'
                }, { status: 400 });
            }
            const controller = getAppController(c.env);
            const updated = await controller.updateSessionTitle(sessionId, title);
            if (!updated) {
                return c.json({
                    success: false,
                    error: 'Session not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { title } });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to update session title',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method,
                sessionId: c.req.param('sessionId')
            }));
            return c.json({
                success: false,
                error: 'Failed to update session title'
            }, { status: 500 });
        }
    });
    /**
     * Get session count and stats
     * GET /api/sessions/stats
     */
    app.get('/api/sessions/stats', async (c) => {
        try {
            const controller = getAppController(c.env);
            const count = await controller.getSessionCount();
            return c.json({
                success: true,
                data: { totalSessions: count }
            });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to get session stats',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method
            }));
            return c.json({
                success: false,
                error: 'Failed to retrieve session stats'
            }, { status: 500 });
        }
    });
    /**
     * Clear all chat sessions
     * DELETE /api/sessions
     */
    app.delete('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const deletedCount = await controller.clearAllSessions();
            return c.json({
                success: true,
                data: { deletedCount }
            });
        } catch (error) {
            console.error(JSON.stringify({
                level: 'error',
                message: 'Failed to clear all sessions',
                error: error instanceof Error ? error.message : String(error),
                url: c.req.url,
                method: c.req.method
            }));
            return c.json({
                success: false,
                error: 'Failed to clear all sessions'
            }, { status: 500 });
        }
    });
    // MCP Server Management Routes
    app.get('/api/mcp/servers', async (c) => {
        const controller = getAppController(c.env);
        const servers = await controller.listMCPServers();
        return c.json({ success: true, data: servers });
    });
    app.post('/api/mcp/servers', async (c) => {
        const { name, sseUrl } = await c.req.json();
        if (!name || !sseUrl) return c.json({ success: false, error: 'Name and SSE URL are required' }, { status: 400 });
        const controller = getAppController(c.env);
        await controller.addMCPServer(name, sseUrl);
        return c.json({ success: true });
    });
    app.delete('/api/mcp/servers/:name', async (c) => {
        const name = c.req.param('name');
        const controller = getAppController(c.env);
        const deleted = await controller.removeMCPServer(name);
        if (!deleted) return c.json({ success: false, error: 'Server not found' }, { status: 404 });
        return c.json({ success: true });
    });
}