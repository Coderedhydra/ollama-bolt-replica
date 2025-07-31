import { Textarea } from './ui/textarea';

interface FileItem {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
  parentId?: string;
  language?: string;
  path: string;
}

interface SimpleCodeEditorProps {
  content: string;
  language?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ content, language, onChange, readOnly }: SimpleCodeEditorProps) {
  return (
    <div className="h-full">
      <Textarea
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full h-full resize-none font-mono text-sm border-0 rounded-none focus-visible:ring-0"
        placeholder="Start typing your code..."
      />
    </div>
  );
}