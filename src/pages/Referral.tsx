import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users } from "lucide-react";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";

const Referral = () => {
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const whatsappNumbers = [
    { number: "09166139051", display: "+234 916 613 9051" },
    { number: "08062990923", display: "+234 806 299 0923" },
    { number: "09035095982", display: "+234 903 509 5982" },
  ];

  const handleWhatsAppClick = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const message = encodeURIComponent("Hello, I would like to request an account for ChatWeet.");
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ChatWeet" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ChatWeet
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="hero" size="lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Get Started</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                ChatWeet
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Request your account and start chatting with AI personas
            </p>
          </div>

          {!showWhatsApp ? (
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Request Your Account</CardTitle>
                <CardDescription>
                  Click below to request access to ChatWeet via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => setShowWhatsApp(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Request Account
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Login here
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Choose a WhatsApp Number</CardTitle>
                <CardDescription>
                  Select a number to chat with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsappNumbers.map((contact) => (
                  <Button
                    key={contact.number}
                    variant="outline"
                    size="lg"
                    className="w-full text-lg justify-start hover:bg-primary/10 hover:border-primary"
                    onClick={() => handleWhatsAppClick(contact.number)}
                  >
                    <MessageCircle className="w-5 h-5 mr-3 text-primary" />
                    {contact.display}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowWhatsApp(false)}
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Referral;
