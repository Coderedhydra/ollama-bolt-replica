import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

interface PreviewFrameProps {
  files: FileNode[];
}

export const PreviewFrame = ({ files }: PreviewFrameProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const generatePreviewHTML = () => {
    const findFile = (path: string): FileNode | null => {
      const searchInNodes = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.path === path) return node;
          if (node.children) {
            const found = searchInNodes(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      return searchInNodes(files);
    };

    const appFile = findFile('src/App.tsx');
    const cssFile = findFile('src/index.css');

    const appContent = appFile?.content || '';
    const cssContent = cssFile?.content || '';

    // Simple React component to HTML conversion (very basic)
    let htmlContent = appContent
      .replace(/import.*?;/g, '')
      .replace(/export default.*?;/g, '')
      .replace(/function App\(\) \{[\s\S]*?return \(/, '')
      .replace(/\);\s*\}$/, '')
      .replace(/className=/g, 'class=');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          ${cssContent}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  };

  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full bg-card flex flex-col border-l border-border">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-card-foreground">Preview</h3>
        
        <div className="flex items-center gap-1">
          {/* View Mode Buttons */}
          <div className="flex bg-muted rounded-md p-1 mr-2">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setViewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 bg-background">
        <div className={`h-full transition-all duration-300 ${getViewModeStyles()}`}>
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : (
              <iframe
                key={refreshKey}
                srcDoc={generatePreviewHTML()}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts"
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Live Preview</span>
          <span className="text-success">• Connected</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="capitalize">{viewMode}</span>
        </div>
      </div>
    </div>
  );
};