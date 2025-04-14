import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AboutSection } from "@/components/about-section";

const AboutPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4">
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;