import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, MessageSquare, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
export function SessionsList() {
  const sessions = useAppStore(s => s.sessions);
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const deleteSession = useAppStore(s => s.deleteSession);
  const renameSession = useAppStore(s => s.renameSession);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const handleRenameStart = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };
  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };
  if (sessions.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
      </div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 pr-2">
        {sessions.map(session => (
          <div
            key={session.id}
            className={cn(
              "group flex items-center justify-between w-full rounded-md text-left transition-colors",
              activeSessionId === session.id ? 'bg-cyan-400/10' : 'hover:bg-zinc-800'
            )}
          >
            {renamingId === session.id ? (
              <div className="flex items-center gap-1 p-1 w-full">
                <Input 
                  value={renameValue} 
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  className="h-8 flex-1 bg-zinc-900"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRenameSubmit}><Check className="w-4 h-4"/></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRenamingId(null)}><X className="w-4 h-4"/></Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-1 justify-start items-center gap-2 truncate h-auto py-2 px-2",
                    activeSessionId === session.id ? 'text-cyan-300' : 'text-zinc-300'
                  )}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="truncate">
                    <p className="truncate text-sm font-medium">{session.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</p>
                  </div>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem onClick={() => handleRenameStart(session.id, session.title)}>
                      <Edit className="w-4 h-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteSession(session.id)} className="text-red-500 focus:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}