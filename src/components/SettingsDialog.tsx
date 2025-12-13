import React from 'react';
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
import { Terminal } from 'lucide-react';
export function SettingsDialog() {
  const isSettingsOpen = useAppStore(s => s.isSettingsOpen);
  const toggleSettings = useAppStore(s => s.toggleSettings);
  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-[625px] bg-zinc-900/80 backdrop-blur-lg border-white/10 text-zinc-200">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure Aetherys Orchestrator to your needs.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="api">API Config</TabsTrigger>
            <TabsTrigger value="user">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="models" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-select">Default Model</Label>
                <Select defaultValue={MODELS[0].id}>
                  <SelectTrigger id="model-select" className="w-full">
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
                <Label htmlFor="cf-base-url">Cloudflare AI Gateway URL</Label>
                <Input id="cf-base-url" value="https://gateway.ai.cloudflare.com/v1/.../openai" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-api-key">Cloudflare API Key</Label>
                <Input id="cf-api-key" type="password" value="••••••••••••••••••••" readOnly />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="user" className="py-4">
            <div className="flex items-center justify-between">
              <Label>Theme</Label>
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