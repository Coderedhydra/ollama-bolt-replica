import { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarProvider } from './ui/sidebar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  FileText, 
  Send, 
  Settings, 
  Key, 
  Plus,
  Play,
  Download,
  Upload,
  FolderOpen,
  Code,
  Eye,
  Trash2,
  Edit,
  Save,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { FileExplorer } from './SimpleFileExplorer';
import { CodeEditor } from './SimpleCodeEditor';
import { PreviewFrame } from './SimplePreviewFrame';
import { ApiKeyDialog } from './ApiKeyDialog';
import { geminiService } from './GeminiService';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
  parentId?: string;
  language?: string;
  path: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function BoltDiyClone() {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'index.html',
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto p-8">
        <h1 class="text-4xl font-bold text-center text-gray-800 mb-8">
            Welcome to Your App
        </h1>
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <p class="text-gray-600 text-center">
                Start building something amazing! Use the chat to generate or modify your code.
            </p>
        </div>
    </div>
</body>
</html>`,
      type: 'file',
      language: 'html'
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(files[0]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentView, setCurrentView] = useState<'code' | 'preview'>('code');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    setHasApiKey(geminiService.hasApiKey());
  }, []);

  const generateFileContent = async (description: string, fileName?: string) => {
    if (!hasApiKey) {
      setShowApiDialog(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const fileExtension = fileName ? fileName.split('.').pop() : 'html';
      const existingContent = selectedFile?.content;
      
      const generatedContent = await geminiService.generateCode(
        description,
        fileExtension,
        existingContent
      );

      if (fileName && !files.find(f => f.name === fileName)) {
        // Create new file
        const newFile: FileItem = {
          id: Date.now().toString(),
          name: fileName,
          path: fileName,
          content: generatedContent,
          type: 'file',
          language: fileExtension
        };
        setFiles(prev => [...prev, newFile]);
        setSelectedFile(newFile);
      } else if (selectedFile) {
        // Update existing file
        setFiles(prev => prev.map(f => 
          f.id === selectedFile.id 
            ? { ...f, content: generatedContent }
            : f
        ));
        setSelectedFile(prev => prev ? { ...prev, content: generatedContent } : null);
      }

      toast({
        title: "Code generated successfully!",
        description: fileName ? `Created ${fileName}` : `Updated ${selectedFile?.name}`,
      });

    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');

    // Check if user wants to create a new file
    const createFileMatch = currentInput.match(/create?\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+|named\s+)?([^\s]+)/i);
    const fileName = createFileMatch?.[1];

    await generateFileContent(currentInput, fileName);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fileName 
        ? `Created new file "${fileName}" based on your request.`
        : `Updated "${selectedFile?.name}" based on your request.`,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, assistantMessage]);
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    setCurrentView('code');
    setIsEditing(false);
  };

  const handleEditFile = () => {
    if (!selectedFile) return;
    setEditContent(selectedFile.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedFile) return;
    
    setFiles(prev => prev.map(f => 
      f.id === selectedFile.id 
        ? { ...f, content: editContent }
        : f
    ));
    setSelectedFile(prev => prev ? { ...prev, content: editContent } : null);
    setIsEditing(false);
    
    toast({
      title: "File saved",
      description: `${selectedFile.name} has been updated.`,
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(files.find(f => f.id !== fileId) || null);
    }
    toast({
      title: "File deleted",
      description: "File has been removed from the project.",
    });
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name (e.g., style.css, script.js):');
    if (!fileName) return;

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      path: fileName,
      content: '',
      type: 'file',
      language: fileName.split('.').pop()
    };

    setFiles(prev => [...prev, newFile]);
    setSelectedFile(newFile);
    setIsEditing(true);
    setEditContent('');
  };

  const downloadProject = () => {
    const projectData = {
      files: files,
      name: 'bolt-diy-project',
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Project downloaded",
      description: "Your project has been saved as project.json",
    });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-lg">Bolt DIY</h1>
            </div>

            <div className="space-y-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowApiDialog(true)}
                className="w-full justify-start"
              >
                <Key className="h-4 w-4 mr-2" />
                {hasApiKey ? 'API Key Set' : 'Set API Key'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateFile}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                New File
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadProject}
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <Separator className="my-4" />

            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onDeleteFile={handleDeleteFile}
            />
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFile && (
                <>
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{selectedFile.name}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {selectedFile && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentView('code')}
                    disabled={currentView === 'code'}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentView('preview')}
                    disabled={currentView === 'preview' || selectedFile.language !== 'html'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>

                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditFile}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex">
            {/* Code/Preview Panel */}
            <div className="flex-1">
              {selectedFile ? (
                <>
                  {currentView === 'code' && (
                    <CodeEditor
                      content={isEditing ? editContent : selectedFile.content}
                      language={selectedFile.language || 'text'}
                      onChange={isEditing ? setEditContent : undefined}
                      readOnly={!isEditing}
                    />
                  )}
                  
                  {currentView === 'preview' && selectedFile.language === 'html' && (
                    <PreviewFrame content={selectedFile.content} />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to start editing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Panel */}
            <div className="w-96 border-l flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold">AI Assistant</h2>
                {!hasApiKey && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Configure your Gemini API key to enable AI features
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm">
                      <p>Ask me to generate or modify your code!</p>
                      <p className="mt-2">Examples:</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>• "Create a login form"</li>
                        <li>• "Add responsive navigation"</li>
                        <li>• "Create file dashboard.html"</li>
                      </ul>
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="bg-muted p-3 rounded-lg mr-4">
                      <p className="text-sm">Generating code...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe what you want to build..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isGenerating}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ApiKeyDialog
          open={showApiDialog}
          onOpenChange={setShowApiDialog}
          onKeySet={() => setHasApiKey(geminiService.hasApiKey())}
        />
      </div>
    </SidebarProvider>
  );
}