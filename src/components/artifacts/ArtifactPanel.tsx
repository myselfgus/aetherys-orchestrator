import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Code, Eye, Terminal, GalleryHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
type Shape = { type: 'rect'; x: number; y: number; width: number; height: number; color: string; }
  | { type: 'circle'; x: number; y: number; radius: number; color: string; }
  | { type: 'text'; x: number; y: number; text: string; font: string; color: string; };
export function ArtifactPanel() {
  const artifact = useAppStore(s => s.artifact);
  const clearArtifact = useAppStore(s => s.clearArtifact);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  useEffect(() => {
    if (artifact.type === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const draw = () => {
        try {
          const data = JSON.parse(artifact.content);
          const shapes: Shape[] = data.shapes || [];
          const parent = canvas.parentElement;
          if (parent) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.clientWidth * dpr;
            canvas.height = parent.clientHeight * dpr;
            ctx.scale(dpr, dpr);
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          shapes.forEach(shape => {
            ctx.fillStyle = shape.color;
            if (shape.type === 'rect') {
              ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === 'circle') {
              ctx.beginPath();
              ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
              ctx.fill();
            } else if (shape.type === 'text') {
              ctx.font = shape.font;
              ctx.fillText(shape.text, shape.x, shape.y);
            }
          });
        } catch (e) {
          toast.error("Failed to render canvas: Invalid drawing commands.");
          console.error("Canvas render error:", e);
        }
      };
      const resizeObserver = new ResizeObserver(draw);
      if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
      }
      requestAnimationFrame(draw);
      return () => resizeObserver.disconnect();
    }
  }, [artifact]);
  if (!artifact.type) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
        <Code className="w-12 h-12 mb-4" />
        <h3 className="font-semibold text-foreground">Artifact Foundry</h3>
        <p className="text-sm">Generated code and previews will appear here.</p>
      </div>
    );
  }
  const handleExport = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'artifact.png';
      link.href = dataUrl;
      link.click();
    }
  };
  const defaultTab = artifact.type === 'preview' ? 'preview' : artifact.type === 'canvas' ? 'canvas' : 'code';
  return (
    <div className="h-full flex flex-col refined-glass bg-white/5">
      <header className="flex items-center justify-between p-2 border-b border-glass-border-soft flex-shrink-0">
        <h3 className="font-semibold text-sm ml-2">Artifact Foundry</h3>
        <Button variant="ghost" size="icon" onClick={clearArtifact} className="text-muted-foreground hover:text-foreground hover:bg-muted minimal-neumorphic">
          <X className="w-4 h-4" />
        </Button>
      </header>
      <div className="flex-1 min-h-0">
        <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-transparent rounded-none border-b border-glass-border-soft shadow-ultra-neumorphic-in">
            <TabsTrigger value="code"><Code className="w-4 h-4 mr-2"/>Code</TabsTrigger>
            <TabsTrigger value="preview" disabled={artifact.type !== 'preview'}><Eye className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
            <TabsTrigger value="canvas" disabled={artifact.type !== 'canvas'}><GalleryHorizontal className="w-4 h-4 mr-2"/>Canvas</TabsTrigger>
            <TabsTrigger value="console" disabled><Terminal className="w-4 h-4 mr-2"/>Console</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="flex-1 min-h-0 porcelain-glass-panel bg-white/5">
            <ScrollArea className="h-full">
              <SyntaxHighlighter language={artifact.language || 'plaintext'} style={isDark ? vscDarkPlus : vs} customStyle={{ background: 'transparent', margin: 0, height: '100%' }} codeTagProps={{ style: { fontFamily: 'inherit' } }} showLineNumbers>
                {artifact.content}
              </SyntaxHighlighter>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preview" className="flex-1 min-h-0 bg-white">
            {artifact.type === 'preview' && <iframe srcDoc={artifact.content} title="Artifact Preview" sandbox="allow-scripts" className="w-full h-full border-0"/>}
          </TabsContent>
          <TabsContent value="canvas" className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 relative bg-muted/50 shadow-ultra-neumorphic-in hover:animate-liquid-scale transition-all duration-500">
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full border-glass-border-soft animate-porcelain-glow-pulse" />
            </div>
            <div className="p-2 border-t border-glass-border-soft flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="minimal-neumorphic animate-liquid-scale"><Download className="w-4 h-4 mr-2"/>Export PNG</Button>
            </div>
          </TabsContent>
          <TabsContent value="console" className="flex-1 min-h-0 p-4">
            <p className="text-muted-foreground text-sm">Console output will appear here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}