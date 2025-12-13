import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MODELS } from '@/lib/chat';
import { ThemeToggle } from './ThemeToggle';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
export function SettingsDialog() {
  const isSettingsOpen = useAppStore(s => s.isSettingsOpen);
  const toggleSettings = useAppStore(s => s.toggleSettings);
  const mcpServers = useAppStore(s => s.mcpServers);
  const fetchMCPServers = useAppStore(s => s.fetchMCPServers);
  const addMCPServer = useAppStore(s => s.addMCPServer);
  const removeMCPServer = useAppStore(s => s.removeMCPServer);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  useEffect(() => {
    if (isSettingsOpen) {
      fetchMCPServers();
    }
  }, [isSettingsOpen, fetchMCPServers]);
  const handleAddServer = async () => {
    if (!newServerName.trim() || !newServerUrl.trim()) {
      toast.error("Server name and URL are required.");
      return;
    }
    const success = await addMCPServer(newServerName, newServerUrl);
    if (success) {
      toast.success(`MCP Server "${newServerName}" added.`);
      setNewServerName('');
      setNewServerUrl('');
    } else {
      toast.error("Failed to add MCP server.");
    }
  };
  const handleRemoveServer = async (name: string) => {
    const success = await removeMCPServer(name);
    if (success) {
      toast.success(`MCP Server "${name}" removed.`);
    } else {
      toast.error("Failed to remove MCP server.");
    }
  };
  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-[625px] refined-glass bg-white/6 text-foreground">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure Aetherys Orchestrator to your needs.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-4 porcelain-glass-panel">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
            <TabsTrigger value="api">API Config</TabsTrigger>
            <TabsTrigger value="user">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="models" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-select" className="font-semibold">Default Model</Label>
                <Select defaultValue={MODELS[0].id}>
                  <SelectTrigger id="model-select" className="w-full glass-bg shadow-inset-glow focus:ring-2 focus:ring-white/20">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This model will be used for new conversations.</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mcp" className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Add MCP Server</Label>
              <div className="flex gap-2">
                <Input placeholder="Server Name" value={newServerName} onChange={e => setNewServerName(e.target.value)} className="glass-bg shadow-inset-glow" />
                <Input placeholder="SSE URL" value={newServerUrl} onChange={e => setNewServerUrl(e.target.value)} className="glass-bg shadow-inset-glow" />
                <Button onClick={handleAddServer} size="icon" className="minimal-neumorphic flex-shrink-0"><PlusCircle className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Connected Servers</Label>
              <ScrollArea className="h-40 porcelain-glass-panel p-2">
                {mcpServers.length > 0 ? (
                  mcpServers.map(server => (
                    <div key={server.name} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                      <div>
                        <p className="font-medium">{server.name}</p>
                        <p className="text-xs text-muted-foreground">{server.sseUrl}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveServer(server.name)} className="text-red-500/80 hover:text-red-500 minimal-neumorphic">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No MCP servers configured.</p>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="api" className="py-4">
            <div className="space-y-4">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Server-Side Configuration</AlertTitle>
                <AlertDescription>
                  API keys are managed securely on the server. These fields are for display and testing purposes only and do not reflect live credentials.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="cf-base-url" className="font-semibold">Cloudflare AI Gateway URL</Label>
                <Input id="cf-base-url" value="https://gateway.ai.cloudflare.com/v1/.../openai" readOnly className="glass-bg shadow-inset-glow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-api-key" className="font-semibold">Cloudflare API Key</Label>
                <Input id="cf-api-key" type="password" value="••••••••••••••••••••" readOnly className="glass-bg shadow-inset-glow" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="user" className="py-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Theme</Label>
              <ThemeToggle className="relative top-0 right-0" />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={toggleSettings}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}