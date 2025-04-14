import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AboutSection } from "@/components/AboutSection";

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full">
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;