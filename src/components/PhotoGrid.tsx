import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fine } from "@/lib/fine";
import { PhotoCard } from "./PhotoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Schema } from "@/lib/db-types";

export function PhotoGrid() {
  const [photos, setPhotos] = useState<Schema["photos"][]>([]);
  const [categories, setCategories] = useState<Schema["categories"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[300px] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <Tabs defaultValue="all" onValueChange={setActiveCategory}>
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.name}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeCategory} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <Link to={`/photo/${photo.id}`} key={photo.id}>
                <PhotoCard photo={photo} />
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}