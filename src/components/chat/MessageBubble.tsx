import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Message, ToolCall } from 'worker/types';
import { cn } from '@/lib/utils';
import { Bot, User, Code, Eye, Wrench, GalleryHorizontal } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from 'sonner';
type MessageBubbleProps = {
  message: Message;
};
const ARTIFACT_REGEX = /```artifact:(\w+)\s*([\s\S]*?)```/gs;
export function MessageBubble({ message }: MessageBubbleProps) {
  const setArtifact = useAppStore(s => s.setArtifact);
  const { cleanContent, artifacts } = useMemo(() => {
    const artifacts: { type: string, language: string, content: string }[] = [];
    const cleanContent = message.content.replace(ARTIFACT_REGEX, (match, language, content) => {
      artifacts.push({ type: 'code', language, content: content.trim() });
      return ''; // Remove artifact from main content
    });
    return { cleanContent, artifacts };
  }, [message.content]);
  const handleViewArtifact = (artifact: { language: string; content: string }) => {
    if (artifact.language === 'canvas') {
      try {
        JSON.parse(artifact.content); // Validate JSON before setting
        setArtifact({
          type: 'canvas',
          language: 'json',
          content: artifact.content,
        });
      } catch (e) {
        toast.error("Failed to parse canvas artifact: Invalid JSON.");
        console.error("Invalid canvas JSON:", e);
      }
    } else {
      setArtifact({
        type: artifact.language === 'html' ? 'preview' : 'code',
        language: artifact.language,
        content: artifact.content,
      });
    }
  };
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex items-start gap-4 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', isUser ? 'bg-indigo-500' : 'bg-cyan-500')}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>
      <div className={cn('w-full max-w-3xl rounded-lg p-4 space-y-4', isUser ? 'bg-indigo-600/20' : 'bg-zinc-800/50 border border-white/10')}>
        <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-pre:bg-zinc-900/70 prose-pre:p-0 prose-pre:rounded-md prose-table:w-full prose-table:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <div className="relative">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-zinc-700 text-zinc-200 px-1 py-0.5 rounded-sm" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
        {artifacts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Code className="w-4 h-4"/> Generated Artifacts</h4>
            {artifacts.map((artifact, index) => (
              <div key={index} className="bg-zinc-900/50 p-3 rounded-md flex justify-between items-center">
                <span className="text-sm font-mono text-zinc-400">artifact.{artifact.language}</span>
                <Button size="sm" variant="ghost" onClick={() => handleViewArtifact(artifact)} className="text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300">
                  {artifact.language === 'canvas' ? <GalleryHorizontal className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} View
                </Button>
              </div>
            ))}
          </div>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="pt-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/10">
                <AccordionTrigger className="text-sm font-semibold text-zinc-300 hover:no-underline">
                  <div className="flex items-center gap-2"><Wrench className="w-4 h-4"/> Tool Calls</div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 p-2 bg-zinc-900/50 rounded-md">
                    {message.toolCalls.map((toolCall: ToolCall) => (
                      <div key={toolCall.id} className="font-mono text-xs text-zinc-400">
                        <p><strong>{toolCall.name}</strong></p>
                        <pre className="text-zinc-500 text-wrap">args: {JSON.stringify(toolCall.arguments)}</pre>
                        {toolCall.result && <pre className="text-zinc-400 mt-1 text-wrap">result: {JSON.stringify(toolCall.result)}</pre>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}