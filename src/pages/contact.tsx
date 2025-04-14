import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, Instagram } from "lucide-react";

const ContactPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Get in Touch</h1>
            <p className="text-muted-foreground mb-6">
              Have a project in mind or want to discuss a collaboration? 
              Fill out the form and I'll get back to you as soon as possible.
            </p>
            
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">contact@luminous.com</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">San Francisco, California</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Instagram className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Social Media</p>
                    <p className="text-sm text-muted-foreground">@luminous_photography</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                Fill out the form below and I'll respond within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;