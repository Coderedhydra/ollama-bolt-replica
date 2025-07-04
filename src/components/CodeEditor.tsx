import { useState, useEffect } from 'react';
import { Copy, Save, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

interface CodeEditorProps {
  file: FileNode | null;
  onUpdateContent: (path: string, content: string) => void;
}

export const CodeEditor = ({ file, onUpdateContent }: CodeEditorProps) => {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      setContent(file.content || '');
      setHasChanges(false);
    }
  }, [file]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== (file?.content || ''));
  };

  const handleSave = () => {
    if (file && hasChanges) {
      onUpdateContent(file.path, content);
      setHasChanges(false);
      toast({
        title: "File saved",
        description: `${file.name} has been updated successfully.`,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "File content has been copied to clipboard.",
    });
  };

  const handleRevert = () => {
    if (file) {
      setContent(file.content || '');
      setHasChanges(false);
      toast({
        title: "Changes reverted",
        description: "File content has been reverted to last saved state.",
      });
    }
  };

  const getLanguageFromExtension = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.json')) return 'json';
    return 'text';
  };

  if (!file) {
    return (
      <div className="h-full bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
            <Copy className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{file.name}</span>
            {hasChanges && (
              <div className="w-2 h-2 bg-accent rounded-full"></div>
            )}
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {getLanguageFromExtension(file.name)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleRevert}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Revert
            </Button>
          )}
          
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-0">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing..."
          className="w-full h-full resize-none rounded-none border-0 bg-transparent font-mono text-sm leading-relaxed focus-visible:ring-0"
          style={{ 
            minHeight: '100%',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Lines: {content.split('\n').length}</span>
          <span>Characters: {content.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-accent">• Unsaved changes</span>
          )}
          <span>{getLanguageFromExtension(file.name)}</span>
        </div>
      </div>
    </div>
  );
};