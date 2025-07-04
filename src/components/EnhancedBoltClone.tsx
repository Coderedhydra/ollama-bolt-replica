import { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { PreviewFrame } from './PreviewFrame';
import { TopBar } from './TopBar';
import { ModelSelector } from './ModelSelector';
import { ProjectSettings } from './ProjectSettings';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ollamaService, OllamaModel, OllamaMessage } from './OllamaService';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

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
  const { toast } = useToast();

  useEffect(() => {
    checkOllamaConnection();
  }, []);

  const checkOllamaConnection = async () => {
    try {
      const isAvailable = await ollamaService.isAvailable();
      setIsOllamaConnected(isAvailable);
      
      if (isAvailable) {
        const models = await ollamaService.getModels();
        setAvailableModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0].name);
        }
        toast({
          title: "Ollama Connected",
          description: `Found ${models.length} models available`,
        });
      } else {
        toast({
          title: "Ollama Not Available",
          description: "Make sure Ollama is running on localhost:11434",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsOllamaConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Ollama service",
        variant: "destructive",
      });
    }
  };

  const updateFileContent = (path: string, content: string) => {
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
  };

  const createNewFile = (name: string, parentPath: string = '') => {
    const newFile: FileNode = {
      name,
      type: 'file',
      path: parentPath ? `${parentPath}/${name}` : name,
      content: getDefaultContent(name)
    };

    const addFile = (nodes: FileNode[]): FileNode[] => {
      if (!parentPath) {
        return [...nodes, newFile];
      }
      
      return nodes.map(node => {
        if (node.path === parentPath && node.type === 'folder') {
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
  };

  const getDefaultContent = (fileName: string): string => {
    if (fileName.endsWith('.tsx')) {
      return `import React from 'react';

interface ${fileName.replace('.tsx', '')}Props {
  // Define your props here
}

const ${fileName.replace('.tsx', '')}: React.FC<${fileName.replace('.tsx', '')}Props> = () => {
  return (
    <div>
      <h1>Hello from ${fileName.replace('.tsx', '')}</h1>
    </div>
  );
};

export default ${fileName.replace('.tsx', '')};`;
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
  };

  const handleSendMessage = async (message: string) => {
    if (!isOllamaConnected) {
      toast({
        title: "Ollama Not Connected",
        description: "Please ensure Ollama is running and try again",
        variant: "destructive",
      });
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: message }]);
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

Be helpful, concise, and provide actionable responses.`;

      const ollamaMessages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user', content: message }
      ];

      const response = await ollamaService.chat(selectedModel, ollamaMessages);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get response from AI model",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error while processing your request. Please make sure Ollama is running and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <TopBar 
        isOllamaConnected={isOllamaConnected}
        onReconnect={checkOllamaConnection}
        selectedModel={selectedModel}
        models={availableModels}
        onModelChange={setSelectedModel}
      />
      
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
  );
};