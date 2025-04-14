import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Schema } from "@/lib/db-types";

export function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Schema["photos"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-muted-foreground mb-8">{error || "Photo not found"}</p>
        <Button onClick={() => navigate("/")}>Back to Gallery</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 flex items-center gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={16} />
        Back to Gallery
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <img 
            src={photo.imageUrl} 
            alt={photo.title} 
            className="w-full h-auto rounded-md shadow-md"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{photo.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Calendar size={16} />
            <span>{photo.dateCreated}</span>
            <span className="px-2 py-1 bg-muted rounded-full text-xs">
              {photo.category}
            </span>
          </div>
          
          {photo.description && (
            <p className="text-muted-foreground leading-relaxed">
              {photo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}