import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Listing } from '@shared/types';
import { toast } from 'sonner';
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
  const { user, isAuthenticated } = useAuthStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }));
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      unit: 'kg',
      quantity: 1,
      grade: 'A',
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=800',
    },
  });
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  const onSubmit: SubmitHandler<ListingFormData> = async (data) => {
    if (!user) {
      toast.error('You must be logged in to create a listing.');
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
      toast.success('Listing created successfully!');
      navigate(`/listing/${createdListing.id}`);
    } catch (error) {
      toast.error('Failed to create listing.');
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
            <CardTitle className="text-2xl">Create a New Listing</CardTitle>
            <CardDescription>Fill out the details below to add your product to the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Organic Hass Avocados" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea placeholder="Describe your product in detail..." {...field} /></FormControl>
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
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Fruits">Fruits</SelectItem>
                            <SelectItem value="Vegetables">Vegetables</SelectItem>
                            <SelectItem value="Grains">Grains</SelectItem>
                            <SelectItem value="Spices">Spices</SelectItem>
                            <SelectItem value="Nuts">Nuts</SelectItem>
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
                        <FormLabel>Grade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="A">Grade A</SelectItem>
                            <SelectItem value="B">Grade B</SelectItem>
                            <SelectItem value="C">Grade C</SelectItem>
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
                        <FormLabel>Price</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="e.g., kg, tonne, piece" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Quantity</FormLabel>
                        <FormControl><Input type="number" placeholder="1000" {...field} /></FormControl>
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
                      <FormLabel>Image URL</FormLabel>
                      <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}