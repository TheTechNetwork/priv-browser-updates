import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Award, MapPin, Mail } from "lucide-react";

export function AboutSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">About the Photographer</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <img 
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000" 
              alt="Photographer portrait" 
              className="rounded-lg w-full aspect-square object-cover"
            />
          </div>
          
          <div className="md:w-2/3 space-y-4">
            <h2 className="text-2xl font-medium">Alex Morgan</h2>
            <p className="text-muted-foreground">
              I'm a professional photographer with over 10 years of experience capturing the beauty of our world. 
              My passion lies in finding unique perspectives and telling stories through my lens.
            </p>
            <p className="text-muted-foreground">
              I specialize in landscape, portrait, and architectural photography, but I'm always exploring new styles and techniques.
              My work has been featured in several exhibitions and publications around the country.
            </p>
            <p className="text-muted-foreground">
              When I'm not behind the camera, you can find me hiking in the mountains, exploring new cities, or teaching photography workshops.
            </p>
            
            <div className="pt-4">
              <Button asChild>
                <Link to="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Get in Touch
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Camera className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Equipment</h3>
              <p className="text-sm text-muted-foreground">
                Sony Alpha a7 III, Canon EOS R5, various prime and zoom lenses for different shooting scenarios.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Award className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Recognition</h3>
              <p className="text-sm text-muted-foreground">
                National Geographic featured photographer, Winner of International Photography Awards 2022.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Location</h3>
              <p className="text-sm text-muted-foreground">
                Based in San Francisco, California. Available for assignments worldwide.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}