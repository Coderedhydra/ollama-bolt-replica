import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { OllamaModel } from './OllamaService';

interface ModelSelectorProps {
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ models, selectedModel, onModelChange, disabled }: ModelSelectorProps) => {
  const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  };

  const getModelDisplayName = (name: string) => {
    return name.replace(':latest', '').replace(':', ' ');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="justify-between min-w-[200px]">
          <span className="truncate">
            {models.length > 0 ? getModelDisplayName(selectedModel) : 'No models'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]">
        {models.length === 0 ? (
          <DropdownMenuItem disabled>
            No models available
          </DropdownMenuItem>
        ) : (
          models.map((model) => (
            <DropdownMenuItem
              key={model.name}
              onClick={() => onModelChange(model.name)}
              className="flex items-center justify-between p-3"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {getModelDisplayName(model.name)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatModelSize(model.size)}
                </div>
              </div>
              {selectedModel === model.name && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};