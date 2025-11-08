import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Leaf, User, LogOut, PlusCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { CurrencySwitcher } from './CurrencySwitcher';
export function Navbar() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navLinks = [
    { to: '/dashboard', label: t('navbar.links.dashboard') },
    { to: '/marketplace', label: t('navbar.links.marketplace') },
    { to: '/education', label: t('navbar.links.educationHub') },
  ];
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return names[0].substring(0, 2);
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
              <Leaf className="h-6 w-6" />
              <span>DAN</span>
            </Link>
            <nav className="hidden md:flex md:ml-10 md:space-x-8">
              {isAuthenticated && navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <LanguageSwitcher />
            <ThemeToggle className="relative" />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link to="/create-listing">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('navbar.createListing')}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.id}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile"><User className="mr-2 h-4 w-4" /><span>{t('navbar.dropdown.profile')}</span></Link>
                    </DropdownMenuItem>
                    {user.role === 'Admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin"><Shield className="mr-2 h-4 w-4" /><span>{t('navbar.dropdown.adminPanel')}</span></Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('navbar.dropdown.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild><Link to="/auth">{t('navbar.signIn')}</Link></Button>
                <Button asChild><Link to="/auth">{t('navbar.signUp')}</Link></Button>
              </div>
            )}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium mt-10">
                  <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Leaf className="h-6 w-6" />
                    <span>DAN</span>
                  </Link>
                  {isAuthenticated ? (
                    <>
                      {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="text-muted-foreground hover:text-foreground">{link.label}</Link>
                      ))}
                      <Link to="/profile" className="text-muted-foreground hover:text-foreground">{t('navbar.dropdown.profile')}</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" className="text-muted-foreground hover:text-foreground">{t('navbar.signIn')}</Link>
                      <Link to="/auth" className="text-muted-foreground hover:text-foreground">{t('navbar.signUp')}</Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}