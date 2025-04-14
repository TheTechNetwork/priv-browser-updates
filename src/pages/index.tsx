import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PhotoGrid } from "@/components/photo-grid";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] w-full bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4" 
            alt="Hero image" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container px-4">
              <div className="max-w-xl space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">Capturing Life's Beautiful Moments</h1>
                <p className="text-lg text-white/80">
                  Professional photography showcasing the art of visual storytelling
                </p>
                <div className="flex gap-4 pt-4">
                  <Button asChild size="lg">
                    <Link to="/about">
                      About Me
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <Link to="/contact">
                      Get in Touch
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Gallery Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold">Photo Gallery</h2>
                <p className="text-muted-foreground">Browse through my collection of photographs</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/about">
                  Learn about the artist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <PhotoGrid />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;