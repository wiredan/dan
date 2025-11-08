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
export function AuthPage() {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error(t('auth.toast.fillFields'));
      return;
    }
    toast.success(t('auth.toast.loginSuccess'));
    login(loginEmail);
    setTimeout(() => navigate('/dashboard'), 1000);
  };
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error(t('auth.toast.fillFields'));
      return;
    }
    toast.success(t('auth.toast.signupSuccess'));
  };
  const SocialButton = ({ children, provider }: { children: React.ReactNode; provider: string }) => (
    <Button variant="outline" className="w-full" onClick={() => toast.info(t('auth.toast.socialNotImplemented', { provider }))}>
      {children}
    </Button>
  );
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                  <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.form.password')}</Label>
                  <Input id="login-password" type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">{t('auth.login.submit')}</Button>
              </form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('auth.social.divider')}</span></div>
              </div>
              <div className="flex flex-col space-y-2">
                <SocialButton provider="Google">{t('auth.social.google')}</SocialButton>
                <SocialButton provider="Apple">{t('auth.social.apple')}</SocialButton>
                <SocialButton provider="Microsoft">{t('auth.social.microsoft')}</SocialButton>
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
                  <Input id="signup-name" placeholder={t('auth.form.namePlaceholder')} required value={signupName} onChange={e => setSignupName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.form.email')}</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.form.password')}</Label>
                  <Input id="signup-password" type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">{t('auth.signup.submit')}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}