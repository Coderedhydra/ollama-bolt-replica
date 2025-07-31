import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { geminiService } from './GeminiService';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeySet: () => void;
}

export function ApiKeyDialog({ open, onOpenChange, onKeySet }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      geminiService.setApiKey(apiKey);
      
      // Test the API key
      await geminiService.generateContent('Hello');
      
      onKeySet();
      onOpenChange(false);
      setApiKey('');
    } catch (error: any) {
      setError(error.message || 'Invalid API key');
      geminiService.clearApiKey();
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    geminiService.clearApiKey();
    setApiKey('');
    onKeySet();
  };

  const currentKey = geminiService.getApiKey();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configure Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API key to enable AI code generation.
            Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentKey && (
            <Alert>
              <AlertDescription>
                API key is configured: {currentKey.substring(0, 8)}...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Don't have an API key?</p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Get your free API key from Google AI Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex gap-2 justify-end">
            {currentKey && (
              <Button variant="outline" onClick={handleClear}>
                Clear Key
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Save & Test'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}