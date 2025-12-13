import React, { useState, useEffect, useCallback } from 'react';
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
    const initializeSession = async () => {
      if (activeSessionId) {
        await loadSession(activeSessionId);
      } else {
        const res = await chatService.createSession();
        if (res.success && res.data) {
          const newSessionId = res.data.sessionId;
          setActiveSessionId(newSessionId);
          chatService.switchSession(newSessionId);
          setMessages([]);
        } else {
          toast.error("Failed to create a new session.");
        }
      }
    };
    initializeSession();
  }, [activeSessionId, setActiveSessionId, loadSession]);
  const handleSendMessage = async (message: string) => {
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
    // Create a new session if it's the first message
    if (messages.length === 0) {
        const res = await chatService.createSession(undefined, chatService.getSessionId(), message);
        if (res.success && res.data) {
            setActiveSessionId(res.data.sessionId);
        }
    }
    try {
      await chatService.sendMessage(message, undefined, (chunk) => {
        if (newAbortController.signal.aborted) {
          // This part is tricky as the fetch promise won't reject on abort.
          // We rely on the stop handler to clean up state.
          return;
        }
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
      // Persist the partially streamed message
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
  return (
    <>
      <MainLayout>
        <ChatArea
          messages={messages}
          streamingMessage={streamingMessage}
          isProcessing={isProcessing}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
        />
      </MainLayout>
      <Toaster theme="dark" richColors closeButton />
    </>
  );
}