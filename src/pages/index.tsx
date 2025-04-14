import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PhotoGrid } from "@/components/PhotoGrid";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4">
          <div className="py-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Photography Portfolio</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Capturing moments and emotions through the lens of creativity
            </p>
          </div>
          <PhotoGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;