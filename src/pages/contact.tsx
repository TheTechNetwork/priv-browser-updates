import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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