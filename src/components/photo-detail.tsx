import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ZoomIn, ZoomOut, Download } from "lucide-react";
import type { Schema } from "@/lib/db-types";

interface PhotoDetailProps {
  photo: Schema["photos"];
}

export function PhotoDetail({ photo }: PhotoDetailProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const navigate = useNavigate();
  
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={handleGoBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleZoom}>
            {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={photo.imageUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      
      <div className={`relative overflow-hidden ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={toggleZoom}>
        <div className={`transition-all duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}>
          <img 
            src={photo.imageUrl} 
            alt={photo.title}
            className="w-full h-auto object-contain rounded-lg"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{photo.title}</h1>
          <Badge>{photo.category}</Badge>
          {photo.featured && (
            <Badge variant="outline" className="bg-primary/20 text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
        
        {photo.description && (
          <p className="text-muted-foreground">{photo.description}</p>
        )}
        
        <p className="text-sm text-muted-foreground">
          Captured on {formatDate(photo.dateCreated)}
        </p>
      </div>
    </div>
  );
}