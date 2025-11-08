import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, CreditCard, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import { api } from '@/lib/api-client';
import { Order, Listing } from '@shared/types';
import { toast } from 'sonner';
export function PaymentPage() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { selectedCurrency, formatCurrency } = useCurrencyStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!orderId) {
      setError(t('payment.error.missingOrderId'));
      setIsLoading(false);
      return;
    }
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const orderData = await api<Order>(`/api/orders/${orderId}`);
        setOrder(orderData);
        const listingData = await api<Listing>(`/api/listings/${orderData.listingId}`);
        setListing(listingData);
      } catch (err) {
        setError(t('payment.error.fetch'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, t]);
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate Paystack API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate a successful payment
    setIsProcessing(false);
    toast.success(t('payment.toast.success'));
    setTimeout(() => navigate(`/order/${orderId}`), 1500);
  };
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  if (error || !order || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('payment.error.title')}</AlertTitle>
          <AlertDescription>{error || t('payment.error.generic')}</AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('payment.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('payment.description')}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Card>
            <CardHeader>
              <CardTitle>{t('payment.summary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={listing.imageUrl} alt={listing.name} className="w-20 h-20 object-cover rounded-md" />
                <div>
                  <h3 className="font-semibold">{listing.name}</h3>
                  <p className="text-sm text-muted-foreground">{t('payment.summary.quantity', { quantity: order.quantity, unit: listing.unit })}</p>
                </div>
              </div>
              <hr />
              <div className="flex justify-between text-sm">
                <p>{t('payment.summary.subtotal')}</p>
                <p>{formatCurrency(order.total - order.fees)}</p>
              </div>
              <div className="flex justify-between text-sm">
                <p>{t('payment.summary.fees')}</p>
                <p>{formatCurrency(order.fees)}</p>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <p>{t('payment.summary.total')}</p>
                <p>{formatCurrency(order.total)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('payment.form.title')}</CardTitle>
              <CardDescription>{t('payment.form.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">{t('payment.form.cardNumber')}</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="card-number" placeholder="0000 0000 0000 0000" className="pl-10" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t('payment.form.expiry')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="expiry" placeholder="MM / YY" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">{t('payment.form.cvc')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="cvc" placeholder="123" className="pl-10" required />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('payment.form.processing')}
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      {t('payment.form.submit', { amount: formatCurrency(order.total) })}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}