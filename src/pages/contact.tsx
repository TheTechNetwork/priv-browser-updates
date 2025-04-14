import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/ContactForm";

const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full">
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;