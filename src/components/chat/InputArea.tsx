import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Send, Square, MicOff, Volume2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
type InputAreaProps = {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onStop: () => void;
  lastAssistantMessage?: string;
};
// Web Speech API might not be available on all browsers or contexts.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition: SpeechRecognition | null = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = true;
}
export function InputArea({ onSendMessage, isProcessing, onStop, lastAssistantMessage }: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
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
  const toggleRecording = () => {
    if (!recognition) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };
  const handleTTS = () => {
    if (!lastAssistantMessage) {
      toast.info("No message to read.");
      return;
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(lastAssistantMessage);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech is not supported in your browser.");
    }
  };
  useEffect(() => {
    if (!recognition) return;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      toast.error(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInput(transcript);
      if (event.results[0].isFinal) {
        onSendMessage(transcript);
        setInput('');
      }
    };
  }, [onSendMessage]);
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
                <Button onClick={handleTTS} variant="ghost" size="icon" className="flex-shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                  <Volume2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Read last message</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={toggleRecording} variant="ghost" size="icon" className="flex-shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                  {isRecording ? <MicOff className="w-5 h-5 text-red-500 animate-pulse" /> : <Mic className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input</TooltipContent>
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