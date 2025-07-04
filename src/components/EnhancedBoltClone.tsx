import { useState, useEffect, useCallback } from 'react';
import { ChatInterface } from './ChatInterface';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { PreviewFrame } from './PreviewFrame';
import { TopBar } from './TopBar';
import { ModelSelector } from './ModelSelector';
import { ProjectSettings } from './ProjectSettings';
import { ErrorBoundary } from './ErrorBoundary';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ollamaService, OllamaModel, OllamaMessage, OllamaConnectionError, OllamaModelError } from './OllamaService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  context: string;
}

const validateFileName = (name: string): string[] => {
  const errors: string[] = [];
  if (!name || name.trim().length === 0) {
    errors.push('File name cannot be empty');
  }
  if (name.includes('/') || name.includes('\\')) {
    errors.push('File name cannot contain slashes');
  }
  if (name.includes('..')) {
    errors.push('File name cannot contain ".."');
  }
  if (name.length > 255) {
    errors.push('File name too long');
  }
  return errors;
};

export const EnhancedBoltClone = () => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'App.tsx',
          type: 'file',
          path: 'src/App.tsx',
          content: `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to AI Builder
          </h1>
          <p className="text-lg text-gray-600">
            Build anything with the power of AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              🚀
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast Development</h3>
            <p className="text-gray-600">Build apps 10x faster with AI assistance</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              🎨
            </div>
            <h3 className="text-lg font-semibold mb-2">Beautiful Design</h3>
            <p className="text-gray-600">AI-generated designs that look professional</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
            <p className="text-gray-600">See your changes in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;`
        },
        {
          name: 'index.css',
          type: 'file',
          path: 'src/index.css',
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}`
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      path: 'package.json',
      content: `{
  "name": "ai-builder-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(files[0]?.children?.[0] || null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Ollama. I can help you build web applications, write code, and create beautiful designs. What would you like to build today?'
    }
  ]);

  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:latest');
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<ErrorState>({
    hasError: false,
    error: null,
    context: ''
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      await checkOllamaConnection();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setConnectionError({
        hasError: true,
        error: error as Error,
        context: 'App initialization'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const checkOllamaConnection = useCallback(async () => {
    try {
      setConnectionError({ hasError: false, error: null, context: '' });
      setLastConnectionCheck(new Date());
      
      const isAvailable = await ollamaService.isAvailable();
      setIsOllamaConnected(isAvailable);
      
      if (isAvailable) {
        try {
          const models = await ollamaService.getModels();
          setAvailableModels(models);
          
          if (models.length > 0) {
            // Check if current selected model exists
            const modelExists = models.some(m => m.name === selectedModel);
            if (!modelExists) {
              setSelectedModel(models[0].name);
            }
          } else {
            toast({
              title: "No Models Available",
              description: "No Ollama models found. Try pulling a model like 'llama3.2'",
              variant: "destructive",
            });
          }
          
          if (!isInitializing) {
            toast({
              title: "Ollama Connected",
              description: `Successfully connected with ${models.length} models available`,
            });
          }
        } catch (modelError) {
          throw new Error(`Failed to fetch models: ${(modelError as Error).message}`);
        }
      } else {
        setAvailableModels([]);
        if (!isInitializing) {
          throw new OllamaConnectionError('Ollama service is not available');
        }
      }
    } catch (error) {
      setIsOllamaConnected(false);
      setAvailableModels([]);
      
      const errorState: ErrorState = {
        hasError: true,
        error: error as Error,
        context: 'Ollama connection check'
      };
      setConnectionError(errorState);
      
      if (!isInitializing) {
        const errorMessage = error instanceof OllamaConnectionError 
          ? error.message 
          : 'Failed to connect to Ollama service';
          
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [selectedModel, isInitializing, toast]);

  const updateFileContent = useCallback((path: string, content: string) => {
    try {
      if (!path || path.trim().length === 0) {
        throw new Error('File path cannot be empty');
      }

      const updateFile = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === path) {
            return { ...node, content };
          }
          if (node.children) {
            return { ...node, children: updateFile(node.children) };
          }
          return node;
        });
      };
      
      setFiles(updateFile(files));
      
      if (selectedFile?.path === path) {
        setSelectedFile({ ...selectedFile, content });
      }
      
      // Auto-save to localStorage for backup
      localStorage.setItem(`file_backup_${path}`, content);
    } catch (error) {
      toast({
        title: "File Update Failed",
        description: `Failed to update ${path}: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [files, selectedFile, toast]);

  const createNewFile = useCallback((name: string, parentPath: string = '') => {
    try {
      const errors = validateFileName(name);
      if (errors.length > 0) {
        toast({
          title: "Invalid File Name",
          description: errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      const newFile: FileNode = {
        name,
        type: 'file',
        path: parentPath ? `${parentPath}/${name}` : name,
        content: getDefaultContent(name)
      };

      // Check for duplicate names
      const checkDuplicate = (nodes: FileNode[]): boolean => {
        return nodes.some(node => node.name === name);
      };

      if (!parentPath && checkDuplicate(files)) {
        toast({
          title: "File Already Exists",
          description: `A file named "${name}" already exists`,
          variant: "destructive",
        });
        return;
      }

      const addFile = (nodes: FileNode[]): FileNode[] => {
        if (!parentPath) {
          return [...nodes, newFile];
        }
        
        return nodes.map(node => {
          if (node.path === parentPath && node.type === 'folder') {
            if (checkDuplicate(node.children || [])) {
              throw new Error(`File "${name}" already exists in this folder`);
            }
            return {
              ...node,
              children: [...(node.children || []), newFile]
            };
          }
          if (node.children) {
            return { ...node, children: addFile(node.children) };
          }
          return node;
        });
      };

      setFiles(addFile(files));
      
      toast({
        title: "File Created",
        description: `Successfully created ${name}`,
      });
    } catch (error) {
      toast({
        title: "File Creation Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [files, toast]);

  const getDefaultContent = useCallback((fileName: string): string => {
    try {
      if (fileName.endsWith('.tsx')) {
        const componentName = fileName.replace('.tsx', '').replace(/[^a-zA-Z0-9]/g, '');
        if (!componentName) {
          throw new Error('Invalid component name');
        }
        
        return `import React from 'react';

interface ${componentName}Props {
  // Define your props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <div>
      <h1>Hello from ${componentName}</h1>
    </div>
  );
};

export default ${componentName};`;
      }
      
      if (fileName.endsWith('.css')) {
        return `/* Styles for ${fileName} */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.button {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover {
  background: #0056b3;
}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error generating default content:', error);
      return '// Error generating default content';
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message || message.trim().length === 0) {
      toast({
        title: "Invalid Message",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (!isOllamaConnected) {
      toast({
        title: "Ollama Not Connected",
        description: "Please ensure Ollama is running and try reconnecting",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No Model Selected",
        description: "Please select an Ollama model first",
        variant: "destructive",
      });
      return;
    }

    // Check if model exists
    const modelExists = await ollamaService.checkModelExists(selectedModel);
    if (!modelExists) {
      toast({
        title: "Model Not Found",
        description: `Model "${selectedModel}" is not available. Please pull the model first.`,
        variant: "destructive",
      });
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: message.trim() }]);
    setIsLoading(true);
    
    try {
      const systemPrompt = `You are an expert web developer and AI assistant. You help users build web applications using React, TypeScript, and modern web technologies. 

Current project structure:
${JSON.stringify(files, null, 2)}

When users ask for code changes:
1. Provide clear, working code
2. Explain what the code does
3. Suggest improvements or alternatives
4. Focus on modern React patterns and best practices
5. Always ensure code is type-safe and follows TypeScript best practices

Be helpful, concise, and provide actionable responses.`;

      const ollamaMessages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user', content: message.trim() }
      ];

      const response = await ollamaService.chat(selectedModel, ollamaMessages);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Received empty response from AI model');
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('AI chat error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      let errorTitle = 'AI Error';
      
      if (error instanceof OllamaConnectionError) {
        errorTitle = 'Connection Error';
        errorMessage = error.message;
      } else if (error instanceof OllamaModelError) {
        errorTitle = 'Model Error';
        errorMessage = error.message;
        
        // If model not found, suggest pulling it
        if (error.message.includes('not found')) {
          errorMessage += ` Try running: ollama pull ${selectedModel}`;
        }
      } else {
        errorMessage = (error as Error).message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but I encountered an error: ${errorMessage}. Please check your Ollama setup and try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isOllamaConnected, selectedModel, messages, files, toast]);

  // Render error state if there's a critical error
  if (connectionError.hasError && isInitializing) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="space-y-3">
                <p><strong>Failed to initialize application</strong></p>
                <p className="text-sm">{connectionError.error?.message}</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={initializeApp} 
                    size="sm"
                    disabled={isInitializing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    size="sm"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-background flex flex-col">
        <TopBar 
          isOllamaConnected={isOllamaConnected}
          onReconnect={checkOllamaConnection}
          selectedModel={selectedModel}
          models={availableModels}
          onModelChange={setSelectedModel}
        />
        
        {/* Connection Status Alert */}
        {connectionError.hasError && !isInitializing && (
          <Alert variant="destructive" className="mx-4 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{connectionError.error?.message}</span>
              <Button 
                onClick={checkOllamaConnection} 
                size="sm" 
                variant="outline"
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <ChatInterface 
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isConnected={isOllamaConnected}
              selectedModel={selectedModel}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* File Explorer & Code Editor */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={30} minSize={20}>
                <FileExplorer
                  files={files}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  onCreateFile={createNewFile}
                />
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={70} minSize={40}>
                <CodeEditor
                  file={selectedFile}
                  onUpdateContent={updateFileContent}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Preview Panel */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <PreviewFrame files={files} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ErrorBoundary>
  );
};