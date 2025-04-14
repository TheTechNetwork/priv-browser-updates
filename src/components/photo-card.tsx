import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Schema } from "@/lib/db-types";

interface PhotoCardProps {
  photo: Schema["photos"];
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <Link to={`/photo/${photo.id}`}>
      <Card className="overflow-hidden group transition-all hover:shadow-lg">
        <CardContent className="p-0 relative">
          <div className="aspect-square overflow-hidden">
            <img 
              src={photo.imageUrl} 
              alt={photo.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-medium">{photo.title}</h3>
            <div className="flex justify-between items-center mt-2">
              <Badge variant="secondary" className="text-xs">
                {photo.category}
              </Badge>
              {photo.featured && (
                <Badge variant="outline" className="bg-primary/20 text-primary-foreground text-xs">
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}