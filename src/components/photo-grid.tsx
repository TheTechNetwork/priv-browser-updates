import { useState, useEffect } from "react";
import { PhotoCard } from "@/components/photo-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { Schema } from "@/lib/db-types";

export function PhotoGrid() {
  const [photos, setPhotos] = useState<Schema["photos"][]>([]);
  const [categories, setCategories] = useState<Schema["categories"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesData = await fine.table("categories").select();
        setCategories(categoriesData);
        
        // Fetch photos
        const photosData = await fine.table("photos").select();
        setPhotos(photosData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const filteredPhotos = activeCategory === "all" 
    ? photos 
    : photos.filter(photo => photo.category === activeCategory);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full max-w-full overflow-x-auto flex flex-nowrap justify-start py-2 h-auto">
          <TabsTrigger value="all" className="rounded-md">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.name}
              className="rounded-md whitespace-nowrap"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
      
      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No photos found in this category.</p>
        </div>
      )}
    </div>
  );
}