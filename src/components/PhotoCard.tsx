import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Schema } from "@/lib/db-types";

interface PhotoCardProps {
  photo: Schema["photos"];
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4">
        <h3 className="font-medium">{photo.title}</h3>
        <p className="text-sm text-muted-foreground">{photo.category}</p>
      </CardFooter>
    </Card>
  );
}