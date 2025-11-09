import { Leaf, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      fill="#229ED9"
    />
    <path
      d="M16.323 7.12702L14.54 15.993C14.322 16.95 13.725 17.182 13.005 16.78L10.113 14.585L8.68502 15.953C8.51702 16.121 8.36702 16.271 8.04902 16.271L8.26802 13.328L13.497 8.59102C13.801 8.31502 13.386 8.14102 12.99 8.41702L6.88802 12.43L4.03802 11.525C3.13802 11.231 3.12602 10.511 4.22402 10.061L15.228 5.86702C16.029 5.56402 16.638 6.04102 16.323 7.12702Z"
      fill="white"
    />
  </svg>
);
export function Footer() {
  const { t } = useTranslation();
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
              <a href="https://twitter.com/wilaya90" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">
                <span className="sr-only">{t('footer.social.twitter')}</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://t.co/vKJVCVie5X" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:opacity-80 transition-opacity">
                <span className="sr-only">{t('footer.social.telegram')}</span>
                <TelegramIcon className="h-6 w-6" />
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
          <p className="text-sm text-muted-foreground/80 xl:text-center mt-2">Built with ❤️ at Cloudflare</p>
        </div>
      </div>
    </footer>
  );
}