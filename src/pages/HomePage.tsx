import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatArea } from '@/components/chat/ChatArea';
import { chatService } from '@/lib/chat';
import { useAppStore } from '@/lib/store';
import { Message } from 'worker/types';
import { Toaster, toast } from '@/components/ui/sonner';
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const fetchSessions = useAppStore(s => s.fetchSessions);
  const createNewSession = useAppStore(s => s.createNewSession);
  const loadSession = useCallback(async (sessionId: string) => {
    chatService.switchSession(sessionId);
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    } else {
      toast.error("Failed to load session.");
      setMessages([]);
    }
  }, []);
  useEffect(() => {
    const initialize = async () => {
      await fetchSessions();
      const sessions = useAppStore.getState().sessions;
      const currentActiveId = useAppStore.getState().activeSessionId;
      if (currentActiveId && sessions.some(s => s.id === currentActiveId)) {
        // Active session is valid, do nothing, the other effect will load it
      } else if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        await createNewSession();
      }
    };
    initialize();
  }, [fetchSessions, createNewSession, setActiveSessionId]);
  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, loadSession]);
  const handleSendMessage = async (message: string) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = await createNewSession();
      if (newId) {
        currentSessionId = newId;
      } else {
        toast.error("Could not create a new session.");
        return;
      }
    }
    setIsProcessing(true);
    setStreamingMessage('');
    const newAbortController = new AbortController();
    setController(newAbortController);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    if (messages.length === 0 && currentSessionId) {
      const title = message.substring(0, 40) + (message.length > 40 ? '...' : '');
      await chatService.updateSessionTitle(currentSessionId, title);
      await fetchSessions();
    }
    try {
      await chatService.sendMessage(message, undefined, (chunk) => {
        if (newAbortController.signal.aborted) return;
        setStreamingMessage(prev => prev + chunk);
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error("An error occurred while sending the message.");
      }
    } finally {
      const finalMessages = await chatService.getMessages();
      if (finalMessages.success && finalMessages.data) {
        setMessages(finalMessages.data.messages);
      }
      setStreamingMessage('');
      setIsProcessing(false);
      setController(null);
    }
  };
  const handleStop = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsProcessing(false);
      const finalMessages = [...messages];
      if (streamingMessage) {
        finalMessages.push({
          id: 'stopped-stream',
          role: 'assistant',
          content: streamingMessage + ' [Stopped by user]',
          timestamp: Date.now(),
        });
      }
      setMessages(finalMessages);
      setStreamingMessage('');
      toast.info("Generation stopped.");
    }
  };
  const lastAssistantMessage = useMemo(() => {
    return [...messages, {content: streamingMessage, role: 'assistant'}]
      .reverse().find(m => m.role === 'assistant' && m.content)?.content;
  }, [messages, streamingMessage]);
  return (
    <>
      <MainLayout>
        <ChatArea
          messages={messages}
          streamingMessage={streamingMessage}
          isProcessing={isProcessing}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          lastAssistantMessage={lastAssistantMessage}
        />
      </MainLayout>
      <Toaster theme="dark" richColors closeButton position="top-right" />
    </>
  );
}