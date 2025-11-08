import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Home, Truck } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api-client';
import { Order, Listing, User, OrderStatus } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
const statusSteps = [
  { name: 'Order Placed', icon: <CheckCircle /> },
  { name: 'Payment in Escrow', icon: <CheckCircle /> },
  { name: 'Shipped', icon: <Truck /> },
  { name: 'Delivered', icon: <Home /> },
];
const statusMap: { [key: string]: number } = {
  'Placed': 0,
  'Paid': 1,
  'Shipped': 2,
  'Delivered': 3,
};
export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [buyer, setBuyer] = useState<User | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAuthenticated, user } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated, user: state.user }));
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
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updatedOrder = await api<Order>(`/api/orders/${order.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder(updatedOrder);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><Skeleton className="h-96 w-full" /></div>;
  }
  if (error || !order || !listing || !buyer || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground mt-2">{error || 'The order you are looking for does not exist.'}</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }
  const currentStepIndex = statusMap[order.status] ?? -1;
  const renderActionButtons = () => {
    if (!user) return null;
    if (user.id === seller.id && order.status === 'Paid') {
      return <Button onClick={() => handleUpdateStatus('Shipped')} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Mark as Shipped'}</Button>;
    }
    if (user.id === buyer.id && order.status === 'Shipped') {
      return <Button onClick={() => handleUpdateStatus('Delivered')} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Confirm Delivery'}</Button>;
    }
    return <Button variant="outline">Dispute Order</Button>;
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Order Tracking</h1>
          <p className="text-muted-foreground">Order ID: {order.id}</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              {statusSteps.map((step, index) => (
                <div key={step.name} className="flex flex-col items-center text-center w-1/4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {index <= currentStepIndex ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </div>
                  <p className={`mt-2 text-sm font-medium ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{step.name}</p>
                </div>
              ))}
            </div>
            <div className="relative w-full h-1 bg-secondary mt-[-2.5rem] -z-10">
              <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={listing.imageUrl} alt={listing.name} className="w-24 h-24 object-cover rounded-md" />
                <div>
                  <h3 className="font-semibold">{listing.name}</h3>
                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity} {listing.unit}</p>
                  <p className="text-sm text-muted-foreground">Price: ${listing.price.toFixed(2)} / {listing.unit}</p>
                </div>
              </div>
              <hr />
              <div className="flex justify-between"><p>Subtotal</p><p>${(order.quantity * listing.price).toFixed(2)}</p></div>
              <div className="flex justify-between"><p>Fees (2.5%)</p><p>${order.fees.toFixed(2)}</p></div>
              <div className="flex justify-between font-bold text-lg"><p>Total</p><p>${order.total.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><h4 className="font-semibold">Buyer</h4><p>{buyer.name}</p><p className="text-sm text-muted-foreground">{buyer.location}</p></div>
              <div><h4 className="font-semibold">Seller</h4><p>{seller.name}</p><p className="text-sm text-muted-foreground">{seller.location}</p></div>
              <div><h4 className="font-semibold">Logistics</h4><p>AgriLink Logistics Partner</p></div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 text-center">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
}