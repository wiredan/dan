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
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.42 0-8.03-3.6-8.03-8.03s3.6-8.03 8.03-8.03c2.5 0 4.1.98 5.07 1.9l2.83-2.83C18.17 1.32 15.64 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.2 0 12.07-4.74 12.07-12.12 0-.8-.08-1.56-.2-2.32H12.48z"
      fill="currentColor"
    />
  </svg>
);
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.15,2.52a4.47,4.47,0,0,0-3.2,1.52,4.2,4.2,0,0,0-1.52,3.24A4.31,4.31,0,0,0,8.6,10.5c.56.31,1.31.53,2.1.53s1.54-.22,2.1-.53a4.31,4.31,0,0,0,1.17-3.24,4.2,4.2,0,0,0-1.52-3.24A4.47,4.47,0,0,0,12.15,2.52Zm.09,1.14a3.32,3.32,0,0,1,2.34,1.06,3.13,3.13,0,0,1,1.06,2.36,3.25,3.25,0,0,1-.88,2.4,2.5,2.5,0,0,1-2.08.88,2.4,2.4,0,0,1-2-.88,3.25,3.25,0,0,1-.88-2.4,3.13,3.13,0,0,1,1.06-2.36A3.32,3.32,0,0,1,12.24,3.66ZM19.8,15.19a7.4,7.4,0,0,1-2.36,5.1,6.57,6.57,0,0,1-4.78,2.19,4.43,4.43,0,0,1-1.56-.27,4.67,4.67,0,0,1-1.41-.78,1.3,1.3,0,0,1-.53-1,1.13,1.13,0,0,1,.42-1,1.41,1.41,0,0,1,1.1-.41,4.1,4.1,0,0,1,1.52.27,4.25,4.25,0,0,1,1.33.7,2.4,2.4,0,0,0,1.52.53,2.54,2.54,0,0,0,2.65-1.4,7,7,0,0,0,1-3.75,6.33,6.33,0,0,1-2.4-1.22,6.5,6.5,0,0,1-1.77-2.32,1.18,1.18,0,0,1,.45-1.31,1.15,1.15,0,0,1,1.3-.11,8.31,8.31,0,0,0,2,1.31,8.14,8.14,0,0,0,2.36,1,1.21,1.21,0,0,1,1.26,1.22A7.49,7.49,0,0,1,19.8,15.19Z"
      fill="currentColor"
    />
  </svg>
);
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M11.4 21.9H2.1V12.6h9.3v9.3zm0-11.4H2.1V2.1h9.3v8.4zm10.5 11.4H12.6V12.6h9.3v9.3zm0-11.4H12.6V2.1h9.3v8.4z" fill="currentColor" />
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