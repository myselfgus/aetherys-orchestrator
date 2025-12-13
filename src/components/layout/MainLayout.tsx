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
      <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <main className="h-full flex flex-col bg-white/95 backdrop-blur-3xl border-b border-white/20">
            {children}
          </main>
        </div>
        <footer className="text-center py-1 text-xs text-foreground/95 porcelain-glass-panel">
          Built with ❤️ at Cloudflare.
        </footer>
        <FileManagerSheet />
        <SettingsDialog />
      </div>
    );
  }
  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-gradient-to-br from-white/95 to-white/98 text-foreground overflow-hidden flex flex-col">
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
                    className="min-w-[260px] refined-glass bg-white/8 border-white/20 shadow-refined"
                  >
                    <AppSidebar />
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-transparent border-x border-border w-2 hover:shadow-refined-lg transition-all duration-300" />
                </motion.div>
              )}
            </AnimatePresence>
            <ResizablePanel minSize={30}>
              <main className="h-full flex flex-col bg-background/80">
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
                  <ResizableHandle withHandle className="bg-transparent border-x border-border w-2 hover:shadow-refined-lg transition-all duration-300" />
                  <ResizablePanel
                    defaultSize={30}
                    minSize={25}
                    maxSize={50}
                    className="min-w-[400px] refined-glass bg-white/8 border-white/20 shadow-refined"
                  >
                    <ArtifactPanel />
                  </ResizablePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </ResizablePanelGroup>
        </div>
        <footer className="text-center py-1 text-xs text-foreground/95 porcelain-glass-panel shadow-refined">
          Built with ❤️ at Cloudflare.
        </footer>
      </div>
      <FileManagerSheet />
      <SettingsDialog />
    </SidebarProvider>
  );
}