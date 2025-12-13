import React from 'react';
import { useAppStore } from '@/lib/store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { UploadCloud, FileText, Download, BrainCircuit } from 'lucide-react';
const mockFiles = [
  { name: 'project-brief.pdf', size: '1.2 MB', type: 'PDF', status: 'Indexed' },
  { name: 'architecture.drawio', size: '450 KB', type: 'Diagram', status: 'Indexed' },
  { name: 'api-schema.json', size: '87 KB', type: 'JSON', status: 'Pending' },
  { name: 'landing-page.html', size: '12 KB', type: 'HTML', status: 'Indexed' },
];
export function FileManagerSheet() {
  const isFileManagerOpen = useAppStore(s => s.isFileManagerOpen);
  const toggleFileManager = useAppStore(s => s.toggleFileManager);
  return (
    <Sheet open={isFileManagerOpen} onOpenChange={toggleFileManager}>
      <SheetContent side="left" className="sm:max-w-lg w-[90vw] bg-zinc-900/80 backdrop-blur-lg border-r-white/10 text-zinc-200 flex flex-col">
        <SheetHeader>
          <SheetTitle>File Manager</SheetTitle>
          <SheetDescription>
            Manage files for the current session's context. Uploaded files can be used by the AI.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0 flex flex-col gap-4 py-4">
          <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-zinc-800/50 transition-colors">
            <UploadCloud className="w-10 h-10 mx-auto text-zinc-500 mb-2" />
            <p className="font-semibold">Click or drag to upload</p>
            <p className="text-xs text-muted-foreground">Upload files to your session's R2 context.</p>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFiles.map(file => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-400"/>{file.name}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>
                      <Badge variant={file.status === 'Indexed' ? 'default' : 'secondary'} className={file.status === 'Indexed' ? 'bg-green-400/20 text-green-300' : ''}>
                        {file.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><BrainCircuit className="w-4 h-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={toggleFileManager} variant="outline">Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}