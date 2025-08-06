
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStorage } from "@/contexts/StorageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const FileUpload: React.FC<{ onUploadComplete?: () => void }> = ({ 
  onUploadComplete 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useStorage();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setCurrentFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCurrentFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress updates since Supabase doesn't provide upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Actual file upload to Supabase storage
      await uploadFile(file, user.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after completion
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 800);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formattedFileName = currentFile ? 
    (currentFile.name.length > 25 
      ? `${currentFile.name.substring(0, 22)}...` 
      : currentFile.name) 
    : '';

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-primary/10 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <div>
          {isUploading ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Uploading {formattedFileName}...
              </p>
              <Progress value={uploadProgress} className="h-2 w-60" />
            </div>
          ) : (
            <>
              <p className="text-lg font-medium">Drag & drop your file here</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                or click to browse from your computer
              </p>
              <Button onClick={triggerFileSelect} className="mt-2">
                Select File
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
