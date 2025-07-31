import { File, Folder, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface FileItem {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
  parentId?: string;
  language?: string;
  path: string;
}

interface SimpleFileExplorerProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileExplorer({ files, selectedFile, onFileSelect, onDeleteFile }: SimpleFileExplorerProps) {
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-1">
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors group ${
            selectedFile?.id === file.id ? 'bg-primary/20 text-primary' : ''
          }`}
          onClick={() => onFileSelect(file)}
        >
          {getFileIcon(file)}
          <span className="text-sm flex-1 truncate">{file.name}</span>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}