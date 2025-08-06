
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileItem, useStorage } from "@/contexts/StorageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Download = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getFileById } = useStorage();

  useEffect(() => {
    const fetchFile = async () => {
      if (fileId) {
        setIsLoading(true);
        
        try {
          // fileId is URL-encoded, so we need to use it as-is
          const foundFile = await getFileById(fileId);
          if (foundFile) {
            setFile(foundFile);
          } else {
            setError("File not found or has been deleted");
          }
        } catch (err) {
          setError("Error loading file");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchFile();
  }, [fileId, getFileById]);

  const handleDownload = () => {
    if (!file) return;
    
    // Create a downloadable link and click it
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg">Loading file information...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border p-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-destructive mx-auto mb-4"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">File Unavailable</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link to="/">
                <Button variant="outline">Return to Home</Button>
              </Link>
            </div>
          ) : file ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 animate-fade-in">
              <div className="flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="m9 15 3 3 3-3" />
                </svg>
              </div>
              
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold mb-1">{file.name}</h1>
                {file.size > 0 && (
                  <p className="text-gray-500 text-sm mb-1">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
              
              <Button
                className="w-full py-6 text-lg mb-4"
                onClick={handleDownload}
              >
                Download File
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                <p>This file was shared via FileDrop</p>
                <Link to="/" className="text-primary hover:underline">
                  Create your own account to share files
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Download;
