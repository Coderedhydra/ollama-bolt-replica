import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleFolder = useCallback((path: string) => {
    try {
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      setExpandedFolders(newExpanded);
      setError(null);
    } catch (error) {
      setError('Failed to toggle folder');
      toast({
        title: "Folder Error",
        description: "Failed to expand/collapse folder",
        variant: "destructive",
      });
    }
  }, [expandedFolders, toast]);

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

  const handleCreateFile = useCallback(() => {
    try {
      if (!newFileName.trim()) {
        throw new Error('File name cannot be empty');
      }
      
      // Basic validation
      if (newFileName.includes('/') || newFileName.includes('\\')) {
        throw new Error('File name cannot contain slashes');
      }
      
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
      setError(null);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast({
        title: "File Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [newFileName, onCreateFile, toast]);

  const renderFileTree = useCallback((nodes: FileNode[], level = 0) => {
    if (!nodes || nodes.length === 0) {
      return null;
    }

    return nodes.map((node) => {
      try {
        return (
          <div key={node.path}>
            <div
              className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-surface-hover transition-colors group ${
                selectedFile?.path === node.path ? 'bg-primary/20 text-primary' : 'text-card-foreground'
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => {
                try {
                  if (node.type === 'folder') {
                    toggleFolder(node.path);
                  } else {
                    onSelectFile(node);
                  }
                  setError(null);
                } catch (error) {
                  setError('Failed to select file');
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
        );
      } catch (error) {
        console.error('Error rendering file node:', error);
        return (
          <div key={node.path} className="flex items-center gap-2 py-1 px-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error loading {node.name}</span>
          </div>
        );
      }
    });
  }, [selectedFile, expandedFolders, toggleFolder, onSelectFile]);

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

      {/* Error Display */}
      {error && (
        <div className="px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-md mx-2 mb-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto p-1"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="p-2 space-y-1">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          renderFileTree(files)
        )}
        {isCreatingFile && (
          <div className="flex items-center gap-2 px-2 py-1">
            <File className="w-4 h-4 text-muted-foreground" />
            <Input
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setError(null); // Clear error when typing
              }}
              placeholder="filename.tsx"
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setNewFileName('');
                  setError(null);
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile();
                } else {
                  setIsCreatingFile(false);
                  setError(null);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};