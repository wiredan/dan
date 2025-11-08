import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Listing } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useCurrencyStore } from '@/lib/currencyStore';
function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const { selectedCurrency } = useCurrencyStore();
  const formatCurrency = (amount: number) => {
    return `${selectedCurrency.symbol}${(amount * selectedCurrency.rate).toFixed(2)}`;
  };
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="p-0">
          <img src={listing.imageUrl} alt={listing.name} className="w-full h-48 object-cover" />
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <Badge variant="secondary">{listing.category}</Badge>
          <CardTitle className="mt-2 text-lg">{listing.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{t('marketplace.card.available', { quantity: listing.quantity, unit: listing.unit })}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="text-lg font-bold text-primary">{formatCurrency(listing.price)}
            <span className="text-sm font-normal text-muted-foreground"> / {listing.unit}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
export function MarketplacePage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const data = await api<Listing[]>('/api/listings');
        setListings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('marketplace.error.fetch'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [t]);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  const filteredListings = listings
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
  const categories = ['all', ...Array.from(new Set(listings.map(l => l.category)))];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('marketplace.title')}</h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">{t('marketplace.description')}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder={t('marketplace.filters.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="md:col-span-1"
          />
          <Select value={category} onValueChange={setCategory} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder={t('marketplace.filters.categoryPlaceholder')} /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? t('marketplace.filters.allCategories') : cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder={t('marketplace.filters.sortByPlaceholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">{t('marketplace.filters.priceAsc')}</SelectItem>
              <SelectItem value="price-desc">{t('marketplace.filters.priceDesc')}</SelectItem>
              <SelectItem value="name-asc">{t('marketplace.filters.nameAsc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10"><p className="text-destructive">{error}</p></div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}