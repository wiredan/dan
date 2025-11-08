import { useParams, Link, Navigate } from 'react-router-dom';
import { MOCK_LISTINGS, MOCK_USERS } from '@shared/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/authStore';
export function ListingDetailPage() {
  const { id } = useParams();
  const listing = MOCK_LISTINGS.find(l => l.id === id);
  const farmer = MOCK_USERS.find(u => u.id === listing?.farmerId);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!listing || !farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground mt-2">The listing you are looking for does not exist.</p>
        <Button asChild className="mt-6"><Link to="/marketplace">Back to Marketplace</Link></Button>
      </div>
    );
  }
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  };
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
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
            <div className="space-y-2">
              <p><span className="font-semibold">Available Quantity:</span> {listing.quantity} {listing.unit}</p>
              <p><span className="font-semibold">Grade:</span> {listing.grade}</p>
              <p><span className="font-semibold">Harvest Date:</span> {new Date(listing.harvestDate).toLocaleDateString()}</p>
            </div>
            <Button size="lg" className="w-full">Place Order</Button>
          </div>
        </div>
      </div>
    </div>
  );
}