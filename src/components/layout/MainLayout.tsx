import React, { useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { AppSidebar } from '@/components/app-sidebar';
import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FileManagerSheet } from '@/components/FileManagerSheet';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
type MainLayoutProps = {
  children: React.ReactNode;
};
export function MainLayout({ children }: MainLayoutProps) {
  const isLeftSidebarOpen = useAppStore(s => s.isLeftSidebarOpen);
  const isRightSidebarOpen = useAppStore(s => s.isRightSidebarOpen);
  const isMobile = useIsMobile();
  useEffect(() => {
    const hasShownToast = sessionStorage.getItem('rateLimitToastShown');
    if (!hasShownToast) {
      toast.info("AI capabilities have rate limits on shared servers.", {
        duration: 8000,
      });
      sessionStorage.setItem('rateLimitToastShown', 'true');
    }
  }, []);
  if (isMobile) {
    return (
      <div className="h-screen w-screen bg-zinc-900 text-foreground overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <main className="h-full flex flex-col bg-zinc-900/80">
            {children}
          </main>
        </div>
        <footer className="text-center py-1 text-xs text-muted-foreground/50 bg-zinc-950 border-t border-white/10">
          Built with ❤️ at Cloudflare.
        </footer>
        <FileManagerSheet />
        <SettingsDialog />
      </div>
    );
  }
  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-zinc-900 text-foreground overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <AnimatePresence initial={false}>
              {isLeftSidebarOpen && (
                <motion.div
                  className="flex"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <ResizablePanel
                    defaultSize={18}
                    minSize={15}
                    maxSize={25}
                    className="min-w-[260px] bg-zinc-950/50 backdrop-blur-lg border-r border-white/10"
                  >
                    <AppSidebar />
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-transparent border-x border-white/10 w-2 hover:bg-cyan-400/20 transition-colors duration-300" />
                </motion.div>
              )}
            </AnimatePresence>
            <ResizablePanel minSize={30}>
              <main className="h-full flex flex-col bg-zinc-900/80">
                {children}
              </main>
            </ResizablePanel>
            <AnimatePresence>
              {isRightSidebarOpen && (
                <motion.div
                  className="flex"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <ResizableHandle withHandle className="bg-transparent border-x border-white/10 w-2 hover:bg-indigo-500/20 transition-colors duration-300" />
                  <ResizablePanel
                    defaultSize={30}
                    minSize={25}
                    maxSize={50}
                    className="min-w-[400px] bg-zinc-950/50 backdrop-blur-lg border-l border-white/10"
                  >
                    <ArtifactPanel />
                  </ResizablePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </ResizablePanelGroup>
        </div>
        <footer className="text-center py-1 text-xs text-muted-foreground/50 bg-zinc-950 border-t border-white/10">
          Built with ❤️ at Cloudflare.
        </footer>
      </div>
      <FileManagerSheet />
      <SettingsDialog />
    </SidebarProvider>
  );
}