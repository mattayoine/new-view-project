
import React, { useRef, useState } from 'react';
import { Upload, X, File, Image } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  dragDropText?: string;
  uploading?: boolean;
  progress?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept,
  maxSize,
  multiple = false,
  disabled = false,
  className,
  children,
  dragDropText = "Drag & drop files here, or click to select",
  uploading = false,
  progress = 0
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    if (maxSize) {
      const invalidFiles = fileArray.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        alert(`Files too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }
    }

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...fileArray]);
      fileArray.forEach(onFileSelect);
    } else {
      setSelectedFiles([fileArray[0]]);
      onFileSelect(fileArray[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  if (children) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        <div onClick={() => inputRef.current?.click()}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          disabled || uploading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">{dragDropText}</p>
          {maxSize && (
            <p className="text-xs text-gray-500">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          )}
        </div>

        {uploading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)}KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
