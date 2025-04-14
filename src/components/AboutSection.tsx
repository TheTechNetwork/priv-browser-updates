import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AboutSection() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <img 
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=1000" 
            alt="Photographer" 
            className="rounded-lg shadow-lg w-full h-auto"
          />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-6">About Me</h1>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Hello! I'm Alex Morgan, a professional photographer with over 10 years of experience 
            capturing life's most beautiful moments. My journey in photography began when I was 
            gifted my first camera at the age of 16, and I've been in love with the art form ever since.
          </p>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            My work focuses primarily on nature, architecture, portraits, and street photography. 
            I believe that every image tells a story, and I strive to create photographs that evoke 
            emotion and capture the essence of my subjects.
          </p>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            When I'm not behind the camera, you can find me hiking in the mountains, exploring new 
            cities, or teaching photography workshops to aspiring photographers.
          </p>
          
          <div className="flex gap-4">
            <Button asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">View My Work</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">My Expertise</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Nature", description: "Capturing the beauty of landscapes and wildlife" },
            { title: "Architecture", description: "Highlighting the art and design of buildings" },
            { title: "Portraits", description: "Revealing the personality and emotion of subjects" },
            { title: "Street", description: "Documenting authentic moments in urban environments" }
          ].map((item, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}