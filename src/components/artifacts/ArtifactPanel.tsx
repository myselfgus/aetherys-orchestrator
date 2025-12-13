import React from 'react';
import { useAppStore } from '@/lib/store';
import { X, Code, Eye, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScrollArea } from '@/components/ui/scroll-area';
export function ArtifactPanel() {
  const artifact = useAppStore(s => s.artifact);
  const clearArtifact = useAppStore(s => s.clearArtifact);
  if (!artifact.type) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
        <Code className="w-12 h-12 mb-4" />
        <h3 className="font-semibold text-zinc-300">Artifact Foundry</h3>
        <p className="text-sm">Generated code and previews will appear here.</p>
      </div>
    );
  }
  const defaultTab = artifact.type === 'preview' ? 'preview' : 'code';
  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      <header className="flex items-center justify-between p-2 border-b border-white/10 flex-shrink-0">
        <h3 className="font-semibold text-sm ml-2">Artifact Foundry</h3>
        <Button variant="ghost" size="icon" onClick={clearArtifact} className="text-zinc-400 hover:text-white hover:bg-zinc-700">
          <X className="w-4 h-4" />
        </Button>
      </header>
      <div className="flex-1 min-h-0">
        <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-950 rounded-none border-b border-white/10">
            <TabsTrigger value="code" disabled={artifact.type === 'preview' && !artifact.content}><Code className="w-4 h-4 mr-2"/>Code</TabsTrigger>
            <TabsTrigger value="preview" disabled={artifact.type !== 'preview'}><Eye className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
            <TabsTrigger value="console" disabled><Terminal className="w-4 h-4 mr-2"/>Console</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <SyntaxHighlighter
                language={artifact.language || 'plaintext'}
                style={vscDarkPlus}
                customStyle={{ background: 'transparent', margin: 0, height: '100%' }}
                codeTagProps={{ style: { fontFamily: 'inherit' } }}
                showLineNumbers
              >
                {artifact.content}
              </SyntaxHighlighter>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preview" className="flex-1 min-h-0 bg-white">
            {artifact.type === 'preview' && (
              <iframe
                srcDoc={artifact.content}
                title="Artifact Preview"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            )}
          </TabsContent>
          <TabsContent value="console" className="flex-1 min-h-0 p-4">
            <p className="text-zinc-500 text-sm">Console output will appear here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}