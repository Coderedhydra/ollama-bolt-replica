import { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { PreviewFrame } from './PreviewFrame';
import { TopBar } from './TopBar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

export const BoltClone = () => {
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
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your App
        </h1>
        <p className="text-lg text-gray-600">
          Start building something amazing!
        </p>
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
}`
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      path: 'package.json',
      content: `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}`
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(files[0]?.children?.[0] || null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you build web applications. What would you like to create today?'
    }
  ]);

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
    
    // Update selected file if it's the one being edited
    if (selectedFile?.path === path) {
      setSelectedFile({ ...selectedFile, content });
    }
  };

  const createNewFile = (name: string, parentPath: string = '') => {
    const newFile: FileNode = {
      name,
      type: 'file',
      path: parentPath ? `${parentPath}/${name}` : name,
      content: ''
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

  const handleSendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I understand you want to ' + message.toLowerCase() + '. Let me help you with that. I would typically use Ollama models to generate the appropriate code and make the necessary changes to your project files.'
      }]);
    }, 1000);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <TopBar />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={30} minSize={25}>
          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
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