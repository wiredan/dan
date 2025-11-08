import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_LISTINGS } from '@shared/mock-data';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/authStore';
function ListingCard({ listing }: { listing: typeof MOCK_LISTINGS[0] }) {
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="p-0">
          <img src={listing.imageUrl} alt={listing.name} className="w-full h-48 object-cover" />
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <Badge variant="secondary">{listing.category}</Badge>
          <CardTitle className="mt-2 text-lg">{listing.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{listing.quantity} {listing.unit} available</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="text-lg font-bold text-primary">${listing.price.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground"> / {listing.unit}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
export function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  const filteredListings = MOCK_LISTINGS
    .filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(l => category === 'all' || l.category === category)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  const categories = ['all', ...Array.from(new Set(MOCK_LISTINGS.map(l => l.category)))];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Marketplace</h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">Browse and trade food crops from verified farmers around the globe.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search for crops..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="md:col-span-1"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}