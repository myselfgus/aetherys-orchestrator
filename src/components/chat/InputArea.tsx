import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Send, Square, MicOff, Volume2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
// Define interfaces for the Web Speech API to ensure TypeScript compatibility
interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: { transcript: string };
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
}
// Augment the global Window interface
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}
type InputAreaProps = {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onStop: () => void;
  lastAssistantMessage?: string;
};
export function InputArea({ onSendMessage, isProcessing, onStop, lastAssistantMessage }: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        toast.error("Speech recognition could not be started. Please check microphone permissions.");
      }
    }
  };
  const handleTTS = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
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
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    const onStart = () => setIsRecording(true);
    const onEnd = () => setIsRecording(false);
    const onError = (event: Event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent;
      if (errorEvent.error === 'not-allowed' || errorEvent.error === 'service-not-allowed') {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      } else {
        toast.error(`Speech recognition error: ${errorEvent.error}`);
      }
      setIsRecording(false);
    };
    const onResult = (event: Event) => {
      const speechEvent = event as SpeechRecognitionEvent;
      const transcript = Array.from(speechEvent.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInput(transcript);
      if (speechEvent.results[0].isFinal) {
        onSendMessage(transcript);
        setInput('');
      }
    };
    recognition.addEventListener('start', onStart);
    recognition.addEventListener('end', onEnd);
    recognition.addEventListener('error', onError);
    recognition.addEventListener('result', onResult);
    return () => {
      recognition.removeEventListener('start', onStart);
      recognition.removeEventListener('end', onEnd);
      recognition.removeEventListener('error', onError);
      recognition.removeEventListener('result', onResult);
      if (isRecording) {
        recognition.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, [onSendMessage, isRecording]);
  return (
    <div className="refined-glass rounded-3xl p-2 flex items-end gap-2 border-white/20 shadow-refined focus-within:shadow-refined-lg focus-within:ring-2 ring-white/20">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-foreground minimal-neumorphic">
              <Paperclip strokeWidth={1.5} className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach files</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TextareaAutosize
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Aetherys anything..."
        className="flex-1 bg-white/8 border-white/20 shadow-refined-inset text-foreground placeholder:text-muted-foreground resize-none border-0 focus:ring-0 p-2 text-base rounded-lg transition-transform duration-300 focus:animate-liquid-scale"
        maxRows={8}
        disabled={isProcessing}
      />
      {isProcessing ? (
        <Button onClick={onStop} size="icon" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white minimal-neumorphic">
          <Square strokeWidth={1.5} className="w-5 h-5" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleTTS} variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-foreground minimal-neumorphic animate-liquid-scale [animation-delay:1s]">
                  <Volume2 strokeWidth={1.5} className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Read last message</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={toggleRecording} variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-foreground minimal-neumorphic animate-liquid-scale [animation-delay:0.5s]">
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div key="recording" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <MicOff strokeWidth={1.5} className="w-5 h-5 text-red-500 animate-porcelain-glow-pulse" />
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Mic strokeWidth={1.5} className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={handleSend} size="icon" className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white minimal-neumorphic hover:animate-liquid-scale active:animate-porcelain-glow-pulse transition-transform" disabled={!input.trim()}>
            <Send strokeWidth={1.5} className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}