import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PhotoDetail } from "@/components/PhotoDetail";

const PhotoPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full">
        <PhotoDetail />
      </main>
      <Footer />
    </div>
  );
};

export default PhotoPage;