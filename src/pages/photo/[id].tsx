import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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