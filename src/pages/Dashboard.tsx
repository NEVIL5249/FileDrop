
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import { useAuth } from "@/contexts/AuthContext";
import { useStorage } from "@/contexts/StorageContext";
import { Button } from "@/components/ui/button";
import { FileItem } from "@/contexts/StorageContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { getUserFiles } = useStorage();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadFiles = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const userFiles = await getUserFiles(user.id);
          setFiles(userFiles);
        } catch (error) {
          console.error("Error loading files:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadFiles();
  }, [user, getUserFiles, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Dashboard</h1>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Upload New File</h2>
            <FileUpload onUploadComplete={handleRefresh} />
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Your Files</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <FileList files={files} onFileDeleted={handleRefresh} />
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
