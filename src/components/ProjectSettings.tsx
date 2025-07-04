import { useState } from 'react';
import { Settings, Download, Upload, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ProjectSettingsProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onExportProject: () => void;
  onImportProject: (files: any) => void;
  onClearProject: () => void;
}

export const ProjectSettings = ({ 
  projectName, 
  onProjectNameChange, 
  onExportProject, 
  onImportProject,
  onClearProject 
}: ProjectSettingsProps) => {
  const [localProjectName, setLocalProjectName] = useState(projectName);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const { toast } = useToast();

  const handleSaveSettings = () => {
    onProjectNameChange(localProjectName);
    localStorage.setItem('ollama-url', ollamaUrl);
    toast({
      title: "Settings saved",
      description: "Your project settings have been updated.",
    });
  };

  const handleExportProject = () => {
    onExportProject();
    toast({
      title: "Project exported",
      description: "Your project has been downloaded as a ZIP file.",
    });
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string);
          onImportProject(projectData);
          toast({
            title: "Project imported",
            description: "Your project has been successfully imported.",
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to import project. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearProject = () => {
    if (confirm('Are you sure you want to clear the entire project? This action cannot be undone.')) {
      onClearProject();
      toast({
        title: "Project cleared",
        description: "All project files have been removed.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="export">Import/Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={localProjectName}
                onChange={(e) => setLocalProjectName(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project..."
                rows={3}
              />
            </div>
            
            <Button onClick={handleSaveSettings} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ollama-url">Ollama Server URL</Label>
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <p className="text-xs text-muted-foreground">
                Make sure Ollama is running on this address
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>AI Model Preferences</Label>
              <div className="text-sm text-muted-foreground">
                <p>• llama3.2: Best for general coding tasks</p>
                <p>• codellama: Specialized for code generation</p>
                <p>• deepseek-coder: Excellent for complex programming</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              <Button onClick={handleExportProject} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Project
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="import-project">Import Project</Label>
                <Input
                  id="import-project"
                  type="file"
                  accept=".json"
                  onChange={handleImportProject}
                />
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  onClick={handleClearProject} 
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Project
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will remove all files and cannot be undone
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};