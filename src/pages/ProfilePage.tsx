import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/authStore";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from '@/lib/api-client';
import { User } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/hooks/use-theme';
export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const login = useAuthStore(s => s.login);
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await api<User>(`/api/users/${user.id}`, {
        method: 'POST',
        body: JSON.stringify({ name, location }),
      });
      login(updatedUser.id);
      toast.success(t('profile.profile.success'));
    } catch (error) {
      toast.error(t('profile.profile.error'));
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(t('profile.kyc.toast.submitted'));
  };
  const handlePaymentConnect = (e: React.FormEvent, method: string) => {
    e.preventDefault();
    toast.success(t('profile.payment.toast.connected', { method }));
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t('profile.title')}</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">{t('profile.tabs.profile')}</TabsTrigger>
            <TabsTrigger value="kyc">{t('profile.tabs.kyc')}</TabsTrigger>
            <TabsTrigger value="payment">{t('profile.tabs.payment')}</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.profile.title')}</CardTitle>
                <CardDescription>{t('profile.profile.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('profile.profile.form.name')}</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('profile.profile.form.email')}</Label>
                      <Input id="email" type="email" defaultValue={user.id} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{t('profile.profile.form.location')}</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>{t('profile.profile.form.theme.label')}</Label>
                    <RadioGroup
                      value={theme}
                      onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light">{t('profile.profile.form.theme.light')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark">{t('profile.profile.form.theme.dark')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system">{t('profile.profile.form.theme.system')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" disabled={isSaving} className="mt-4">
                    {isSaving ? t('profile.profile.form.saving') : t('profile.profile.form.save')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.kyc.title')}</CardTitle>
                <CardDescription>{t('profile.kyc.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {user.kycStatus === 'Verified' ? (
                  <div className="text-center p-8 bg-secondary rounded-lg">
                    <h3 className="text-lg font-semibold text-green-500">{t('profile.kyc.verified.title')}</h3>
                    <p className="text-muted-foreground mt-2">{t('profile.kyc.verified.description')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleKycSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-type">{t('profile.kyc.form.docType')}</Label>
                      <Input id="document-type" placeholder={t('profile.kyc.form.docTypePlaceholder')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-upload">{t('profile.kyc.form.docUpload')}</Label>
                      <Input id="document-upload" type="file" />
                    </div>
                    <Button type="submit">{t('profile.kyc.form.submit')}</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.payment.title')}</CardTitle>
                <CardDescription>{t('profile.payment.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bank" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bank">{t('profile.payment.tabs.bank')}</TabsTrigger>
                    <TabsTrigger value="card">{t('profile.payment.tabs.card')}</TabsTrigger>
                    <TabsTrigger value="wallet">{t('profile.payment.tabs.wallet')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="bank" className="mt-4">
                    <form onSubmit={(e) => handlePaymentConnect(e, 'Bank Account')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name">{t('profile.payment.form.bankName')}</Label>
                        <Input id="bank-name" placeholder="First Bank of Agriculture" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="iban">{t('profile.payment.form.iban')}</Label>
                        <Input id="iban" placeholder="NG12345678901234567890" required />
                      </div>
                      <Button type="submit">{t('profile.payment.form.submit.bank')}</Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="card" className="mt-4">
                    <form onSubmit={(e) => handlePaymentConnect(e, 'Card')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-number">{t('profile.payment.form.cardNumber')}</Label>
                        <Input id="card-number" placeholder="**** **** **** 1234" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">{t('profile.payment.form.expiry')}</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">{t('profile.payment.form.cvc')}</Label>
                          <Input id="cvc" placeholder="123" required />
                        </div>
                      </div>
                      <Button type="submit">{t('profile.payment.form.submit.card')}</Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="wallet" className="mt-4">
                    <form onSubmit={(e) => handlePaymentConnect(e, 'Sidrachain Wallet')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="wallet-address">{t('profile.payment.form.walletAddress')}</Label>
                        <Input id="wallet-address" placeholder="0x..." required />
                      </div>
                      <Button type="submit">{t('profile.payment.form.submit.wallet')}</Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}