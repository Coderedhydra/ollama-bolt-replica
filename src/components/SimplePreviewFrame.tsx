interface SimplePreviewFrameProps {
  content: string;
}

export function PreviewFrame({ content }: SimplePreviewFrameProps) {
  return (
    <div className="h-full bg-white">
      <iframe
        srcDoc={content}
        className="w-full h-full border-0"
        title="Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
}