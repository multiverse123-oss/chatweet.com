import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="ChatWeet" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ChatWeet
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your AI-powered conversational companion
            </p>
          </div>

          {/* Product - Dormant Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Features
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Pricing
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Updates
                </span>
              </li>
            </ul>
          </div>

          {/* Company - Dormant Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  About
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Careers
                </span>
              </li>
            </ul>
          </div>

          {/* Resources - Only Support is Active */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Documentation
                </span>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  Support
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                  Community
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ChatWeet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
