import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PhotoDetail } from "@/components/photo-detail";
import { Loader2 } from "lucide-react";
import { fine } from "@/lib/fine";
import type { Schema } from "@/lib/db-types";

const PhotoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<Schema["photos"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const photoData = await fine.table("photos").select().eq("id", parseInt(id));
        
        if (photoData && photoData.length > 0) {
          setPhoto(photoData[0]);
        } else {
          setError("Photo not found");
        }
      } catch (err) {
        console.error("Error fetching photo:", err);
        setError("Failed to load photo");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPhoto();
  }, [id]);
  
  if (!id) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-destructive">{error}</h2>
            <p className="text-muted-foreground mt-2">
              The photo you're looking for might have been removed or doesn't exist.
            </p>
          </div>
        ) : photo ? (
          <PhotoDetail photo={photo} />
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default PhotoPage;