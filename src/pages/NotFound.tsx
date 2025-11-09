import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-card/50 backdrop-blur-sm border-border/50 text-center space-y-6">
        <img src={logo} alt="ChatWeet" className="w-16 h-16 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button variant="hero" size="lg" className="w-full">
            Return Home
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
