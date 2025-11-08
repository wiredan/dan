import { Leaf, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <Leaf className="h-7 w-7" />
              <span>DAN</span>
            </Link>
            <p className="text-muted-foreground text-base">
              Decentralized Agribusiness Network connecting farmers, distributors, and investors.
            </p>
            <div className="flex space-x-6">
              <a href="https://twitter.com/wilaya90" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Solutions</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/marketplace" className="text-base text-muted-foreground hover:text-primary">Marketplace</Link></li>
                  <li><Link to="/dashboard" className="text-base text-muted-foreground hover:text-primary">Order Tracking</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                  <li><a href="mailto:dansidran@gmail.com" className="text-base text-muted-foreground hover:text-primary">Contact Us</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/education" className="text-base text-muted-foreground hover:text-primary">Education Hub</Link></li>
                  <li><Link to="/dan-ai" className="text-base text-muted-foreground hover:text-primary">DAN. AI</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-base text-muted-foreground xl:text-center">&copy; {new Date().getFullYear()} DAN Platform. All rights reserved.</p>
          <p className="text-sm text-muted-foreground/80 xl:text-center mt-2">Built with ��️ at Cloudflare</p>
        </div>
      </div>
    </footer>
  );
}