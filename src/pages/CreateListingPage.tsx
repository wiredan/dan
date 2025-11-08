import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Listing } from '@shared/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
const listingSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().positive('Price must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  grade: z.enum(['A', 'B', 'C']),
  imageUrl: z.string().url('Please enter a valid image URL'),
});
type ListingFormData = z.infer<typeof listingSchema>;
export function CreateListingPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }));
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: undefined,
      unit: 'kg',
      quantity: undefined,
      grade: 'A',
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=800',
    },
  });
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  const onSubmit: SubmitHandler<ListingFormData> = async (data) => {
    if (!user) {
      toast.error(t('createListing.error.notLoggedIn'));
      return;
    }
    setIsSubmitting(true);
    const newListingData: Omit<Listing, 'id'> = {
      ...data,
      farmerId: user.id,
      harvestDate: new Date().toISOString(),
    };
    try {
      const createdListing = await api<Listing>('/api/listings', {
        method: 'POST',
        body: JSON.stringify(newListingData),
      });
      toast.success(t('createListing.success'));
      navigate(`/listing/${createdListing.id}`);
    } catch (error) {
      toast.error(t('createListing.error.failed'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('createListing.title')}</CardTitle>
            <CardDescription>{t('createListing.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createListing.form.productName.label')}</FormLabel>
                      <FormControl><Input placeholder={t('createListing.form.productName.placeholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createListing.form.description.label')}</FormLabel>
                      <FormControl><Textarea placeholder={t('createListing.form.description.placeholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createListing.form.category.label')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder={t('createListing.form.category.placeholder')} /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Fruits">{t('categories.fruits')}</SelectItem>
                            <SelectItem value="Vegetables">{t('categories.vegetables')}</SelectItem>
                            <SelectItem value="Grains">{t('categories.grains')}</SelectItem>
                            <SelectItem value="Spices">{t('categories.spices')}</SelectItem>
                            <SelectItem value="Nuts">{t('categories.nuts')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createListing.form.grade.label')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder={t('createListing.form.grade.placeholder')} /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="A">{t('grades.a')}</SelectItem>
                            <SelectItem value="B">{t('grades.b')}</SelectItem>
                            <SelectItem value="C">{t('grades.c')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createListing.form.price.label')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={event => field.onChange(+event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createListing.form.unit.label')}</FormLabel>
                        <FormControl><Input placeholder={t('createListing.form.unit.placeholder')} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createListing.form.quantity.label')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            onChange={event => field.onChange(+event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createListing.form.imageUrl.label')}</FormLabel>
                      <FormControl><Input placeholder={t('createListing.form.imageUrl.placeholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? t('createListing.form.submit.submitting') : t('createListing.form.submit.default')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}