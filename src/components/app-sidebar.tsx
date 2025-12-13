import React, { useEffect } from "react";
import { Sparkles, PlusCircle, HardDrive, Settings, Server, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { SessionsList } from "./SessionsList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
export function AppSidebar(): JSX.Element {
  const createNewSession = useAppStore(s => s.createNewSession);
  const fetchSessions = useAppStore(s => s.fetchSessions);
  const toggleFileManager = useAppStore(s => s.toggleFileManager);
  const toggleSettings = useAppStore(s => s.toggleSettings);
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center animate-float shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tighter">Aetherys</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 flex flex-col">
        <Button variant="ghost" className="w-full justify-start gap-2 text-base mb-2 neumorphic-btn" onClick={createNewSession}>
          <PlusCircle className="w-5 h-5" /> New Chat
        </Button>
        <div className="flex-1 min-h-0">
          <SessionsList />
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">MCP Servers</span>
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Server className="w-4 h-4 text-green-500 dark:text-green-400" />
                </TooltipTrigger>
                <TooltipContent side="top">Cloudflare Tools: Connected</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Wifi className="w-4 h-4 text-green-500 dark:text-green-400" />
                </TooltipTrigger>
                <TooltipContent side="top">Web Search: Connected</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <WifiOff className="w-4 h-4 text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent side="top">Custom Server: Disconnected</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button variant="ghost" className="w-full justify-start gap-2 neumorphic-btn" onClick={toggleFileManager}>
              <HardDrive className="w-4 h-4" /> Files
            </Button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button variant="ghost" className="w-full justify-start gap-2 neumorphic-btn" onClick={toggleSettings}>
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}