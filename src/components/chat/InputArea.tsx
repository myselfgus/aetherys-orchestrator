import React, { useState, useRef, KeyboardEvent } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Send, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
type InputAreaProps = {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onStop: () => void;
};
export function InputArea({ onSendMessage, isProcessing, onStop }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-2 flex items-end gap-2 backdrop-blur-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-400/50">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
              <Paperclip className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach files (coming soon)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TextareaAutosize
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Aetherys anything..."
        className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none border-0 focus:ring-0 p-2 text-base"
        maxRows={8}
        disabled={isProcessing}
      />
      {isProcessing ? (
        <Button onClick={onStop} size="icon" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Square className="w-5 h-5" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                  <Mic className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input (coming soon)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={handleSend} size="icon" className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white" disabled={!input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}