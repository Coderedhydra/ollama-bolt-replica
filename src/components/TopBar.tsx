import { Bot, Code, Download, Settings, Share, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import { ProjectSettings } from './ProjectSettings';
import { OllamaModel } from './OllamaService';

interface TopBarProps {
  isOllamaConnected?: boolean;
  onReconnect?: () => void;
  selectedModel?: string;
  models?: OllamaModel[];
  onModelChange?: (model: string) => void;
}

export const TopBar = ({ 
  isOllamaConnected = false, 
  onReconnect, 
  selectedModel = 'llama3.2:latest', 
  models = [], 
  onModelChange 
}: TopBarProps) => {
  return (
    <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">AI Builder</h1>
        </div>
        
        <div className="text-sm text-muted-foreground hidden sm:block">
          Build anything with AI
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          {isOllamaConnected ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
          <span className="text-xs text-muted-foreground">
            {isOllamaConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {onModelChange && (
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={!isOllamaConnected}
          />
        )}
        
        <Button variant="ghost" size="sm" onClick={onReconnect}>
          <Bot className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
        
        <Button variant="ghost" size="sm">
          <Code className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        <Button variant="ghost" size="sm">
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
        
        <ProjectSettings
          projectName="AI Builder Project"
          onProjectNameChange={() => {}}
          onExportProject={() => {}}
          onImportProject={() => {}}
          onClearProject={() => {}}
        />
      </div>
    </div>
  );
};