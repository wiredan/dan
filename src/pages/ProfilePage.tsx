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
export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const login = useAuthStore(s => s.login);
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isSaving, setIsSaving] = useState(false);
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
  const handlePaystackConnect = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('profile.payment.toast.connected'));
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
                <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                  <Button type="submit" disabled={isSaving}>
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
                <form onSubmit={handlePaystackConnect} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paystack-email">{t('profile.payment.form.email')}</Label>
                    <Input id="paystack-email" type="email" placeholder="you@provider.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">{t('profile.payment.form.bankName')}</Label>
                    <Input id="bank-name" placeholder="First Bank of Agriculture" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">{t('profile.payment.form.accountNumber')}</Label>
                    <Input id="account-number" placeholder="1234567890" required />
                  </div>
                  <Button type="submit">{t('profile.payment.form.submit')}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}