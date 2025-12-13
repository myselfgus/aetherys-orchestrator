import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { AppSidebar } from '@/components/app-sidebar';
import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';
type MainLayoutProps = {
  children: React.ReactNode;
};
export function MainLayout({ children }: MainLayoutProps) {
  const isLeftSidebarOpen = useAppStore(s => s.isLeftSidebarOpen);
  const isRightSidebarOpen = useAppStore(s => s.isRightSidebarOpen);
  return (
    <div className="h-screen w-screen bg-zinc-900 text-foreground overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {isLeftSidebarOpen && (
            <>
              <ResizablePanel
                defaultSize={18}
                minSize={15}
                maxSize={25}
                className="min-w-[260px] bg-zinc-950/50 backdrop-blur-lg border-r border-white/10"
              >
                <AppSidebar />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-transparent border-x border-white/10 w-2 hover:bg-cyan-400/20 transition-colors duration-300" />
            </>
          )}
          <ResizablePanel defaultSize={isLeftSidebarOpen && isRightSidebarOpen ? 42 : isLeftSidebarOpen || isRightSidebarOpen ? 62 : 100} minSize={30}>
            <main className="h-full flex flex-col bg-zinc-900/80">
              {children}
            </main>
          </ResizablePanel>
          {isRightSidebarOpen && (
            <>
              <ResizableHandle withHandle className="bg-transparent border-x border-white/10 w-2 hover:bg-indigo-500/20 transition-colors duration-300" />
              <ResizablePanel
                defaultSize={40}
                minSize={25}
                maxSize={50}
                className="min-w-[400px] bg-zinc-950/50 backdrop-blur-lg border-l border-white/10"
              >
                <ArtifactPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      <footer className="text-center py-1 text-xs text-muted-foreground/50 bg-zinc-950 border-t border-white/10">
        There is a limit on the number of requests that can be made to the AI servers. Built with ❤️ at Cloudflare.
      </footer>
    </div>
  );
}