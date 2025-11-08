import { useParams, Link, Navigate } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_LISTINGS, MOCK_USERS } from '@shared/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Package, Truck, Home } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
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
  const { id } = useParams();
  const order = MOCK_ORDERS.find(o => o.id === id);
  const listing = MOCK_LISTINGS.find(l => l.id === order?.listingId);
  const buyer = MOCK_USERS.find(u => u.id === order?.buyerId);
  const seller = MOCK_USERS.find(u => u.id === order?.sellerId);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!order || !listing || !buyer || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground mt-2">The order you are looking for does not exist.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }
  const currentStepIndex = statusMap[order.status] ?? -1;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Order Tracking</h1>
          <p className="text-muted-foreground">Order ID: {order.id}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
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
              <div className="absolute top-0 left-0 h-1 bg-primary" style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}></div>
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
              <div>
                <h4 className="font-semibold">Buyer</h4>
                <p>{buyer.name}</p>
                <p className="text-sm text-muted-foreground">{buyer.location}</p>
              </div>
              <div>
                <h4 className="font-semibold">Seller</h4>
                <p>{seller.name}</p>
                <p className="text-sm text-muted-foreground">{seller.location}</p>
              </div>
              <div>
                <h4 className="font-semibold">Logistics</h4>
                <p>AgriLink Logistics Partner</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline">Dispute Order</Button>
        </div>
      </div>
    </div>
  );
}