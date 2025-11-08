import { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/authStore";
import { useCurrencyStore } from "@/lib/currencyStore";
import { api } from "@/lib/api-client";
import { Order, Listing } from "@shared/types";
export function OrdersPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedCurrency } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<Map<string, Listing>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const formatCurrency = (amount: number) => {
    return `${selectedCurrency.symbol}${(amount * selectedCurrency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allOrders, allListings] = await Promise.all([
          api<Order[]>('/api/orders'),
          api<Listing[]>('/api/listings'),
        ]);
        const userOrders = allOrders.filter(o => o.buyerId === user.id || o.sellerId === user.id);
        setOrders(userOrders);
        const listingsMap = new Map(allListings.map(l => [l.id, l]));
        setListings(listingsMap);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('ordersPage.title')}</CardTitle>
            <CardDescription>{t('ordersPage.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">{t('ordersPage.noOrders')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('ordersPage.table.orderId')}</TableHead>
                    <TableHead>{t('ordersPage.table.product')}</TableHead>
                    <TableHead>{t('ordersPage.table.role')}</TableHead>
                    <TableHead>{t('ordersPage.table.status')}</TableHead>
                    <TableHead className="text-right">{t('ordersPage.table.total')}</TableHead>
                    <TableHead className="text-right">{t('ordersPage.table.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => {
                    const listing = listings.get(order.listingId);
                    const userRole = order.buyerId === user?.id ? t('ordersPage.roles.buyer') : t('ordersPage.roles.seller');
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}</TableCell>
                        <TableCell className="font-medium">{listing?.name || '...'}</TableCell>
                        <TableCell>{userRole}</TableCell>
                        <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/order/${order.id}`}>{t('ordersPage.table.view')}</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}