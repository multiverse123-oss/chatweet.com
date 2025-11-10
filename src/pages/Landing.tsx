import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Shield, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Multi-Persona Chat</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Chat with{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Any Persona
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From doctors to lawyers, engineers to journalists. Get expert advice in any tone. 
              Upload screens with OCR. All in one intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 space-y-4 hover:shadow-glow transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-semibold">Multiple Personas</h3>
            <p className="text-muted-foreground">
              Switch between professional personas - doctor, lawyer, engineer, journalist, and more.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 space-y-4 hover:shadow-glow transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-semibold">Tone Control</h3>
            <p className="text-muted-foreground">
              Adjust the mood - playful, serious, emergency, romantic. Get responses that match your needs.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 space-y-4 hover:shadow-glow transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-semibold">OCR Integration</h3>
            <p className="text-muted-foreground">
              Upload screen images and let AI extract text, understand context, and provide insights.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
