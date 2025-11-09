import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api-client';
import { AuthResponse, User } from '@shared/types';
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
    <path fill="#4285F4" d="M24 9.5c3.13 0 5.9 1.12 7.96 3.04l6.06-6.06C34.44 2.81 29.58 1 24 1 14.4 1 6.48 6.84 3.24 15.21l7.44 5.76C12.24 14.26 17.64 9.5 24 9.5z"></path>
    <path fill="#34A853" d="M46.2 25.02c0-1.62-.15-3.2-.42-4.7H24v8.94h12.48c-.54 2.88-2.1 5.34-4.44 6.96l7.14 5.52c4.14-3.84 6.48-9.42 6.48-16.72z"></path>
    <path fill="#FBBC05" d="M10.68 20.97C10.26 19.65 10 18.21 10 16.71s.26-2.94.68-4.26l-7.44-5.76C1.08 10.11 0 13.29 0 16.71s1.08 6.6 3.24 9.27l7.44-5.01z"></path>
    <path fill="#EA4335" d="M24 47c5.58 0 10.44-1.81 13.92-4.92l-7.14-5.52c-1.86 1.26-4.2 2.04-6.78 2.04-6.36 0-11.76-4.74-13.32-11.1H3.24c3.24 8.37 11.16 14.22 20.76 14.22z"></path>
  </svg>
);
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.15,2.52a4.47,4.47,0,0,0-3.2,1.52,4.2,4.2,0,0,0-1.52,3.24A4.31,4.31,0,0,0,8.6,10.5c.56.31,1.31.53,2.1.53s1.54-.22,2.1-.53a4.31,4.31,0,0,0,1.17-3.24,4.2,4.2,0,0,0-1.52-3.24A4.47,4.47,0,0,0,12.15,2.52Zm.09,1.14a3.32,3.32,0,0,1,2.34,1.06,3.13,3.13,0,0,1,1.06,2.36,3.25,3.25,0,0,1-.88,2.4,2.5,2.5,0,0,1-2.08.88,2.4,2.4,0,0,1-2-.88,3.25,3.25,0,0,1-.88-2.4,3.13,3.13,0,0,1,1.06-2.36A3.32,3.32,0,0,1,12.24,3.66ZM19.8,15.19a7.4,7.4,0,0,1-2.36,5.1,6.57,6.57,0,0,1-4.78,2.19,4.43,4.43,0,0,1-1.56-.27,4.67,4.67,0,0,1-1.41-.78,1.3,1.3,0,0,1-.53-1,1.13,1.13,0,0,1,.42-1,1.41,1.41,0,0,1,1.1-.41,4.1,4.1,0,0,1,1.52.27,4.25,4.25,0,0,1,1.33.7,2.4,2.4,0,0,0,1.52.53,2.54,2.54,0,0,0,2.65-1.4,7,7,0,0,0,1-3.75,6.33,6.33,0,0,1-2.4-1.22,6.5,6.5,0,0,1-1.77-2.32,1.18,1.18,0,0,1,.45-1.31,1.15,1.15,0,0,1,1.3-.11,8.31,8.31,0,0,0,2,1.31,8.14,8.14,0,0,0,2.36,1,1.21,1.21,0,0,1,1.26,1.22A7.49,7.49,0,0,1,19.8,15.19Z"
      fill="#1D1D1F"
      className="dark:fill-white"
    />
  </svg>
);
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
  </svg>
);
export function AuthPage() {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const authLogin = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error(t('auth.toast.fillFields'));
      return;
    }
    setIsLoading(true);
    try {
      const response = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      authLogin(response);
      toast.success(t('auth.toast.loginSuccess'));
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      console.error('Login API Error:', JSON.stringify(error, null, 2));
      toast.error((error as Error).message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error(t('auth.toast.fillFields'));
      return;
    }
    setIsLoading(true);
    try {
      await api<User>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      toast.success(t('auth.toast.signupSuccess'));
      // Optionally switch to login tab
    } catch (error) {
      toast.error((error as Error).message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSocialLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    let userEmail = '';
    switch (provider) {
      case 'google':
        userEmail = 'user-1'; // Corresponds to Amina Yusuf
        break;
      case 'apple':
        userEmail = 'user-2'; // Corresponds to Carlos Gomez
        break;
      case 'microsoft':
        userEmail = 'user-3'; // Corresponds to Fatima Al-Sayed
        break;
    }
    setIsLoading(true);
    try {
      const response = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, password: 'social_login_mock_password' }),
      });
      authLogin(response);
      toast.success(t('auth.toast.loginSuccess'));
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      console.error('Login API Error:', JSON.stringify(error, null, 2));
      toast.error((error as Error).message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('auth.tabs.login')}</TabsTrigger>
          <TabsTrigger value="signup">{t('auth.tabs.signup')}</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.login.title')}</CardTitle>
              <CardDescription>{t('auth.login.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.form.email')}</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.form.password')}</Label>
                  <Input id="login-password" type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? '...' : t('auth.login.submit')}</Button>
              </form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('auth.social.divider')}</span></div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                  <GoogleIcon className="h-5 w-5" />
                  {t('auth.social.google')}
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handleSocialLogin('apple')} disabled={isLoading}>
                  <AppleIcon className="h-5 w-5" />
                  {t('auth.social.apple')}
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handleSocialLogin('microsoft')} disabled={isLoading}>
                  <MicrosoftIcon className="h-5 w-5" />
                  {t('auth.social.microsoft')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.signup.title')}</CardTitle>
              <CardDescription>{t('auth.signup.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.form.name')}</Label>
                  <Input id="signup-name" placeholder={t('auth.form.namePlaceholder')} required value={signupName} onChange={e => setSignupName(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.form.email')}</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.form.password')}</Label>
                  <Input id="signup-password" type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? '...' : t('auth.signup.submit')}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}