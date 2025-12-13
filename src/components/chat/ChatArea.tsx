import React, { useRef, useEffect } from 'react';
import { Message } from 'worker/types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles } from 'lucide-react';
type ChatAreaProps = {
  messages: Message[];
  streamingMessage: string;
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
  onStop: () => void;
};
export function ChatArea({ messages, streamingMessage, isProcessing, onSendMessage, onStop }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, streamingMessage]);
  const hasMessages = messages.length > 0 || streamingMessage;
  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden relative">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full">
          {hasMessages ? (
            <div className="space-y-8">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {streamingMessage && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingMessage,
                    timestamp: Date.now(),
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center">
              <div className="p-4 bg-cyan-400/10 rounded-full mb-4 border border-cyan-400/20">
                <Sparkles className="w-10 h-10 text-cyan-300 animate-float" />
              </div>
              <h1 className="text-4xl font-bold text-zinc-200">Aetherys Orchestrator</h1>
              <p className="text-lg text-zinc-400 mt-2">Your AI-powered command center for Cloudflare.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="w-full px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <InputArea onSendMessage={onSendMessage} isProcessing={isProcessing} onStop={onStop} />
        </div>
      </div>
    </div>
  );
}