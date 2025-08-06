
import { useState, useEffect } from "react";
import { FileItem, useStorage } from "@/contexts/StorageContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface FileListProps {
  files: FileItem[];
  onFileDeleted: () => void;
}

const FileList = ({ files, onFileDeleted }: FileListProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const { deleteFile } = useStorage();
  
  if (!files.length) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    );
  }

  const handleShowShareDialog = (file: FileItem) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    if (!selectedFile) return;
    
    navigator.clipboard.writeText(selectedFile.shareLink);
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard",
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  const handleDeleteFile = async (id: string) => {
    try {
      await deleteFile(id);
      onFileDeleted();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell className="hidden md:table-cell">{formatFileSize(file.size)}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(file.uploadDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowShareDialog(file)}
                    >
                      Share
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share file</DialogTitle>
            <DialogDescription>
              Anyone with this link can download your file
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              readOnly
              value={selectedFile?.shareLink || ""}
              className="flex-1"
            />
            <Button type="submit" size="sm" onClick={handleCopyLink}>
              Copy
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <div className="text-xs text-muted-foreground mt-2">
              No sign-in required to download
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileList;
