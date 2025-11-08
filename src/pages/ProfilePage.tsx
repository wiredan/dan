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
export function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const login = useAuthStore(s => s.login); // We need a way to update the store's user
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
      // This is a mock-friendly way to update the user in the store.
      // In a real app with JWTs, you might refetch the user or decode the new token.
      login(updatedUser.id); // Re-triggers the mock login to update the store user
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("KYC documents submitted for review. (This is a demo)");
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Profile & Settings</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.id} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Verify your identity to unlock full platform features.</CardDescription>
              </CardHeader>
              <CardContent>
                {user.kycStatus === 'Verified' ? (
                  <div className="text-center p-8 bg-secondary rounded-lg">
                    <h3 className="text-lg font-semibold text-green-500">Your account is verified!</h3>
                    <p className="text-muted-foreground mt-2">You have full access to all platform features.</p>
                  </div>
                ) : (
                  <form onSubmit={handleKycSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Input id="document-type" placeholder="e.g., National ID, Passport" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-upload">Upload Document</Label>
                      <Input id="document-upload" type="file" />
                    </div>
                    <Button type="submit">Submit for Verification</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your connected payment methods.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 bg-secondary rounded-lg">
                  <p className="text-muted-foreground">Payment method integration is coming soon.</p>
                  <Button className="mt-4" onClick={() => toast.info("Paystack integration is under development.")}>Add Paystack Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}