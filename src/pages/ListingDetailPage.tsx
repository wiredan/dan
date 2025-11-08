import { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Listing, User, Order } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [farmer, setFarmer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { isAuthenticated, user } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated, user: state.user }));
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const listingData = await api<Listing>(`/api/listings/${id}`);
        setListing(listingData);
        if (listingData.farmerId) {
          const farmerData = await api<User>(`/api/users/${listingData.farmerId}`);
          setFarmer(farmerData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listing details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const handlePlaceOrder = async () => {
    if (!user || !listing) return;
    if (quantity <= 0 || quantity > listing.quantity) {
      toast.error('Invalid quantity.');
      return;
    }
    setIsPlacingOrder(true);
    try {
      const orderPayload = {
        listingId: listing.id,
        buyerId: user.id,
        quantity: quantity,
      };
      const newOrder = await api<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      toast.success('Order placed successfully!');
      navigate(`/order/${newOrder.id}`);
    } catch (error) {
      toast.error('Failed to place order.');
      console.error(error);
    } finally {
      setIsPlacingOrder(false);
    }
  };
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  const getInitials = (name: string = '') => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  };
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="w-full h-auto aspect-square rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/2" />
              <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">Listing Not Found</h1>
        <p className="text-muted-foreground mt-2">{error || 'The listing you are looking for does not exist.'}</p>
        <Button asChild className="mt-6"><Link to="/marketplace">Back to Marketplace</Link></Button>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <img src={listing.imageUrl} alt={listing.name} className="w-full h-auto object-cover rounded-lg shadow-lg aspect-square" />
          </div>
          <div className="space-y-6">
            <div>
              <Badge>{listing.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">{listing.name}</h1>
              <p className="text-muted-foreground mt-2">{listing.description}</p>
            </div>
            <div className="text-3xl font-bold text-primary">
              ${listing.price.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">/ {listing.unit}</span>
            </div>
            <Card>
              <CardHeader><CardTitle>Seller Information</CardTitle></CardHeader>
              <CardContent>
                {farmer ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={farmer.avatarUrl} alt={farmer.name} />
                      <AvatarFallback>{getInitials(farmer.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{farmer.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {farmer.location}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-500 mt-1">
                        <ShieldCheck className="h-4 w-4" /> {farmer.kycStatus}
                      </div>
                    </div>
                  </div>
                ) : <Skeleton className="h-16 w-full" />}
              </CardContent>
            </Card>
            <div className="space-y-2">
              <p><span className="font-semibold">Available Quantity:</span> {listing.quantity} {listing.unit}</p>
              <p><span className="font-semibold">Grade:</span> {listing.grade}</p>
              <p><span className="font-semibold">Harvest Date:</span> {new Date(listing.harvestDate).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({listing.unit})</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
                max={listing.quantity}
              />
            </div>
            <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={isPlacingOrder || user?.id === farmer?.id}>
              {isPlacingOrder ? 'Placing Order...' : (user?.id === farmer?.id ? 'This is your listing' : 'Place Order')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}