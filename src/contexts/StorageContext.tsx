
import React, { createContext, useContext, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  shareLink: string;
  uploadDate: Date;
  userId: string;
  path: string;
}

interface StorageContextType {
  uploadFile: (file: File, userId: string) => Promise<FileItem>;
  getUserFiles: (userId: string) => Promise<FileItem[]>;
  getFileById: (fileId: string) => Promise<FileItem | undefined>;
  deleteFile: (fileId: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
};

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate a unique file path for storage
  const generateFilePath = (userId: string, fileName: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${userId}/${timestamp}-${randomId}-${safeFileName}`;
  };

  const uploadFile = async (file: File, userId: string): Promise<FileItem> => {
    try {
      const filePath = generateFilePath(userId, file.name);
      
      // Upload to Supabase storage
      const { data, error } = await supabase
        .storage
        .from('file_uploads')
        .upload(filePath, file);
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Upload failed with no error");
      }
      
      // Get the public URL for the file
      const { data: urlData } = supabase
        .storage
        .from('file_uploads')
        .getPublicUrl(data.path);
      
      // Create the file item - using the actual path as the ID
      // This ensures IDs are consistent across sessions
      const fileId = data.path;
      const domain = window.location.origin;
      
      const fileItem: FileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        shareLink: `${domain}/download/${encodeURIComponent(fileId)}`,
        uploadDate: new Date(),
        userId,
        path: data.path,
      };
      
      // Store the file metadata in localStorage for retrieval
      const storedFiles = getStoredFiles();
      const updatedFiles = [...storedFiles, fileItem];
      localStorage.setItem("files", JSON.stringify(updatedFiles));
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded`,
      });
      
      return fileItem;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStoredFiles = (): FileItem[] => {
    const storedFiles = localStorage.getItem("files");
    return storedFiles ? JSON.parse(storedFiles) : [];
  };

  const getUserFiles = async (userId: string): Promise<FileItem[]> => {
    const allFiles = getStoredFiles();
    return allFiles.filter((file) => file.userId === userId);
  };

  const getFileById = async (fileId: string): Promise<FileItem | undefined> => {
    try {
      // First try to find in localStorage
      const allFiles = getStoredFiles();
      const localFile = allFiles.find((file) => file.id === fileId);
      
      if (localFile) {
        return localFile;
      }
      
      // If not found in localStorage, try to get it directly from Supabase
      // Decode the fileId which is actually the file path
      const decodedPath = decodeURIComponent(fileId);
      
      // Get the file metadata from Supabase
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('file_uploads')
        .getPublicUrl(decodedPath);
      
      if (fileError || !fileData) {
        console.error("Error fetching file:", fileError);
        return undefined;
      }
      
      // Extract filename from the path
      const fileName = decodedPath.split('/').pop() || 'file';
      const cleanFileName = fileName.replace(/^\d+-\w+-/, '').replace(/_/g, ' ');
      
      // Create a new FileItem using the available data
      return {
        id: decodedPath,
        name: cleanFileName,
        size: 0, // We don't have this info without downloading
        type: '', // We don't have this info without downloading
        url: fileData.publicUrl,
        shareLink: `${window.location.origin}/download/${encodeURIComponent(decodedPath)}`,
        uploadDate: new Date(),
        userId: '', // We don't know this for public files
        path: decodedPath
      };
    } catch (error) {
      console.error("Error in getFileById:", error);
      return undefined;
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      const allFiles = getStoredFiles();
      const fileToDelete = allFiles.find((file) => file.id === fileId);
      
      if (!fileToDelete) {
        throw new Error("File not found");
      }
      
      // Delete from Supabase storage
      const { error } = await supabase
        .storage
        .from('file_uploads')
        .remove([fileToDelete.path]);
      
      if (error) throw error;
      
      // Update localStorage
      const updatedFiles = allFiles.filter((file) => file.id !== fileId);
      localStorage.setItem("files", JSON.stringify(updatedFiles));
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <StorageContext.Provider
      value={{
        uploadFile,
        getUserFiles,
        getFileById,
        deleteFile,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export default StorageContext;
