import { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onSelectFile: (file: FileNode) => void;
  onCreateFile: (name: string, parentPath?: string) => void;
}

export const FileExplorer = ({ files, selectedFile, onSelectFile, onCreateFile }: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.path) ? 
        <FolderOpen className="w-4 h-4 text-accent" /> : 
        <Folder className="w-4 h-4 text-accent" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getFileTypeColor = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return 'text-blue-400';
    if (fileName.endsWith('.css')) return 'text-pink-400';
    if (fileName.endsWith('.json')) return 'text-yellow-400';
    if (fileName.endsWith('.html')) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-surface-hover transition-colors ${
            selectedFile?.path === node.path ? 'bg-primary/20 text-primary' : 'text-card-foreground'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              onSelectFile(node);
            }
          }}
        >
          {node.type === 'folder' && (
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
            >
              {expandedFolders.has(node.path) ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </Button>
          )}
          
          {getFileIcon(node)}
          
          <span className={`text-sm truncate flex-1 ${
            node.type === 'file' ? getFileTypeColor(node.name) : ''
          }`}>
            {node.name}
          </span>
          
          {node.type === 'folder' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsCreatingFile(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-card-foreground">Explorer</h3>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => setIsCreatingFile(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* File Tree */}
      <div className="p-2 space-y-1">
        {renderFileTree(files)}
        
        {isCreatingFile && (
          <div className="flex items-center gap-2 px-2 py-1">
            <File className="w-4 h-4 text-muted-foreground" />
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.tsx"
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile();
                } else {
                  setIsCreatingFile(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};