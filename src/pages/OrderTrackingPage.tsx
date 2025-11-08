import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Home, Truck, Package, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Order, Listing, User, OrderStatus } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { DisputeModal } from '@/components/DisputeModal';
import { useCurrencyStore } from '@/lib/currencyStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, differenceInHours } from 'date-fns';
interface ChartData {
  name: string;
  duration: number;
  fill: string;
}
export function OrderTrackingPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [buyer, setBuyer] = useState<User | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDisputeModalOpen, setDisputeModalOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { isAuthenticated, user } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated, user: state.user }));
  const { selectedCurrency } = useCurrencyStore();
  const formatCurrency = (amount: number) => {
    return `${selectedCurrency.symbol}${(amount * selectedCurrency.rate).toFixed(2)}`;
  };
  const statusSteps = [
    { name: t('orderTracking.status.placed'), icon: <CheckCircle /> },
    { name: t('orderTracking.status.paid'), icon: <CheckCircle /> },
    { name: t('orderTracking.status.logisticsPickedUp'), icon: <Package /> },
    { name: t('orderTracking.status.shipped'), icon: <Truck /> },
    { name: t('orderTracking.status.delivered'), icon: <Home /> },
  ];
  const statusMap: { [key in OrderStatus]: number } = {
    'Placed': 0,
    'Paid': 1,
    'LogisticsPickedUp': 2,
    'Shipped': 3,
    'Delivered': 4,
    'Disputed': -1,
    'Cancelled': -1,
  };
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const orderData = await api<Order>(`/api/orders/${id}`);
      setOrder(orderData);
      const [listingData, buyerData, sellerData] = await Promise.all([
        api<Listing>(`/api/listings/${orderData.listingId}`),
        api<User>(`/api/users/${orderData.buyerId}`),
        api<User>(`/api/users/${orderData.sellerId}`),
      ]);
      setListing(listingData);
      setBuyer(buyerData);
      setSeller(sellerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orderTracking.error.fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (order?.statusHistory && order.statusHistory.length > 1) {
      const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];
      const data: ChartData[] = [];
      for (let i = 0; i < order.statusHistory.length - 1; i++) {
        const start = new Date(order.statusHistory[i].timestamp);
        const end = new Date(order.statusHistory[i + 1].timestamp);
        const duration = differenceInHours(end, start);
        data.push({
          name: t(`orderTracking.status.${order.statusHistory[i].status.charAt(0).toLowerCase() + order.statusHistory[i].status.slice(1)}`),
          duration: duration > 0 ? duration : 1, // Min 1 hour for visibility
          fill: colors[i % colors.length],
        });
      }
      setChartData(data);
    }
  }, [order, t]);
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updatedOrder = await api<Order>(`/api/orders/${order.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder(updatedOrder);
      toast.success(t('orderTracking.toast.statusUpdated', { status: newStatus }));
    } catch (error) {
      toast.error(t('orderTracking.toast.statusUpdateFailed'));
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDisputeSubmit = async (reason: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updatedOrder = await api<Order>(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setOrder(updatedOrder);
      toast.success(t('orderTracking.toast.disputeSubmitted'));
      setDisputeModalOpen(false);
    } catch (error) {
      toast.error(t('orderTracking.toast.disputeFailed'));
    } finally {
      setIsUpdating(false);
    }
  };
  const handleResolveDispute = async (resolutionStatus: 'Delivered' | 'Cancelled') => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updatedOrder = await api<Order>(`/api/orders/${order.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ status: resolutionStatus }),
      });
      setOrder(updatedOrder);
      toast.success(t('orderTracking.toast.disputeResolved'));
    } catch (error) {
      toast.error(t('orderTracking.toast.resolveFailed'));
    } finally {
      setIsUpdating(false);
    }
  };
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (isLoading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><Skeleton className="h-96 w-full" /></div>;
  if (error || !order || !listing || !buyer || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">{t('orderTracking.notFound.title')}</h1>
        <p className="text-muted-foreground mt-2">{error || t('orderTracking.notFound.description')}</p>
        <Button asChild className="mt-6"><Link to="/dashboard">{t('orderTracking.notFound.button')}</Link></Button>
      </div>
    );
  }
  const currentStepIndex = statusMap[order.status] ?? -1;
  const renderActionButtons = () => {
    if (!user) return null;
    const isDisputed = order.status === 'Disputed';
    const isFinished = order.status === 'Delivered' || order.status === 'Cancelled';
    // Admin Actions
    if (user.role === 'Admin') {
      return (
        <div className="flex gap-2 justify-center">
          {isDisputed && (
            <>
              <Button onClick={() => handleResolveDispute('Delivered')} disabled={isUpdating} variant="secondary">{t('orderTracking.actions.resolveRelease')}</Button>
              <Button onClick={() => handleResolveDispute('Cancelled')} disabled={isUpdating} variant="destructive">{t('orderTracking.actions.resolveRefund')}</Button>
            </>
          )}
          {!isFinished && <Button onClick={() => handleUpdateStatus('Cancelled')} disabled={isUpdating} variant="destructive">{t('orderTracking.actions.cancelOrder')}</Button>}
        </div>
      );
    }
    if (isFinished) return <p className="text-muted-foreground">{t('orderTracking.orderComplete')}</p>;
    if (isDisputed) return <p className="text-destructive font-semibold flex items-center justify-center gap-2"><ShieldAlert size={16} /> {t('orderTracking.underReview')}</p>;
    // Participant Actions
    switch (user.role) {
      case 'Farmer':
        if (order.status === 'LogisticsPickedUp' && user.id === seller.id) {
          return <Button onClick={() => handleUpdateStatus('Shipped')} disabled={isUpdating}>{isUpdating ? t('orderTracking.actions.updating') : t('orderTracking.actions.markShipped')}</Button>;
        }
        break;
      case 'Distributor':
        if (order.status === 'Shipped' && user.id === buyer.id) {
          return <Button onClick={() => handleUpdateStatus('Delivered')} disabled={isUpdating}>{isUpdating ? t('orderTracking.actions.updating') : t('orderTracking.actions.confirmDelivery')}</Button>;
        }
        break;
      case 'Logistics':
        if (order.status === 'Paid') {
          return <Button onClick={() => handleUpdateStatus('LogisticsPickedUp')} disabled={isUpdating}>{isUpdating ? t('orderTracking.actions.updating') : t('orderTracking.actions.confirmPickup')}</Button>;
        }
        break;
      default:
        break;
    }
    // Dispute button for buyer/seller if not finished/disputed
    if (user.id === buyer.id || user.id === seller.id) {
      return <Button variant="outline" onClick={() => setDisputeModalOpen(true)}>{t('orderTracking.actions.dispute')}</Button>;
    }
    return null;
  };
  return (
    <>
      <DisputeModal isOpen={isDisputeModalOpen} onClose={() => setDisputeModalOpen(false)} onSubmit={handleDisputeSubmit} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t('orderTracking.title')}</h1>
            <p className="text-muted-foreground">{t('orderTracking.orderId')}: {order.id}</p>
          </div>
          <Card className="mb-8">
            <CardHeader><CardTitle>{t('orderTracking.status.title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex flex-col items-center text-center w-1/5">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {index <= currentStepIndex ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{step.name}</p>
                  </div>
                ))}
              </div>
              <div className="relative w-full h-1 bg-secondary mt-[-2.5rem] -z-10 mx-auto" style={{ maxWidth: '80%' }}>
                <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}></div>
              </div>
            </CardContent>
          </Card>
          {chartData.length > 0 && (
            <Card className="mb-8">
              <CardHeader><CardTitle>{t('orderTracking.timelineChart.title')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" unit="h" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      labelFormatter={(value) => t('orderTracking.timelineChart.tooltipLabel', { status: value })}
                      formatter={(value) => [`${value} ${t('orderTracking.timelineChart.tooltipIntro')}`]}
                    />
                    <Bar dataKey="duration" background={{ fill: 'hsl(var(--muted))' }}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>{t('orderTracking.summary.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={listing.imageUrl} alt={listing.name} className="w-24 h-24 object-cover rounded-md" />
                  <div>
                    <h3 className="font-semibold">{listing.name}</h3>
                    <p className="text-sm text-muted-foreground">{t('orderTracking.summary.quantity')}: {order.quantity} {listing.unit}</p>
                    <p className="text-sm text-muted-foreground">{t('orderTracking.summary.price')}: {formatCurrency(listing.price)} / {listing.unit}</p>
                  </div>
                </div>
                <hr />
                <div className="flex justify-between"><p>{t('orderTracking.summary.subtotal')}</p><p>{formatCurrency(order.quantity * listing.price)}</p></div>
                <div className="flex justify-between"><p>{t('orderTracking.summary.fees')}</p><p>{formatCurrency(order.fees)}</p></div>
                <div className="flex justify-between font-bold text-lg"><p>{t('orderTracking.summary.total')}</p><p>{formatCurrency(order.total)}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('orderTracking.participants.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><h4 className="font-semibold">{t('orderTracking.participants.buyer')}</h4><p>{buyer.name}</p><p className="text-sm text-muted-foreground">{buyer.location}</p></div>
                <div><h4 className="font-semibold">{t('orderTracking.participants.seller')}</h4><p>{seller.name}</p><p className="text-sm text-muted-foreground">{seller.location}</p></div>
                <div><h4 className="font-semibold">{t('orderTracking.participants.logistics')}</h4><p>{t('orderTracking.participants.logisticsPartner')}</p></div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            {renderActionButtons()}
          </div>
        </div>
      </div>
    </>
  );
}