import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { User, Order, UserRole } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
export function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const usersById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const fetchedUsers = await api<User[]>('/api/users');
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error(t('admin.users.error'));
      console.error(error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const fetchedOrders = await api<Order[]>('/api/orders');
        setOrders(fetchedOrders);
      } catch (error) {
        toast.error(t('admin.transactions.error'));
        console.error(error);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchUsers();
    fetchOrders();
  }, [t]);
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdatingRole(userId);
    try {
      await api<User>(`/api/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(t('admin.users.toast.roleSuccess'));
      // Refetch users to get the latest state
      await fetchUsers();
    } catch (error) {
      toast.error(t('admin.users.toast.roleError'));
      console.error(error);
    } finally {
      setIsUpdatingRole(null);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.description')}</p>
        </div>
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
            <TabsTrigger value="transactions">{t('admin.tabs.transactions')}</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.users.title')}</CardTitle>
                <CardDescription>{t('admin.users.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.users.table.name')}</TableHead>
                        <TableHead>{t('admin.users.table.role')}</TableHead>
                        <TableHead>{t('admin.users.table.kyc')}</TableHead>
                        <TableHead>{t('admin.users.table.location')}</TableHead>
                        <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell><Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge></TableCell>
                          <TableCell><Badge variant={user.kycStatus === 'Verified' ? 'default' : 'secondary'}>{user.kycStatus}</Badge></TableCell>
                          <TableCell>{user.location}</TableCell>
                          <TableCell className="text-right">
                            {user.role === 'Admin' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRoleChange(user.id, 'Farmer')}
                                disabled={isUpdatingRole === user.id}
                              >
                                {t('admin.users.actions.demote')}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRoleChange(user.id, 'Admin')}
                                disabled={isUpdatingRole === user.id}
                              >
                                {t('admin.users.actions.promote')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.transactions.title')}</CardTitle>
                <CardDescription>{t('admin.transactions.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.transactions.table.orderId')}</TableHead>
                        <TableHead>{t('admin.transactions.table.buyer')}</TableHead>
                        <TableHead>{t('admin.transactions.table.seller')}</TableHead>
                        <TableHead>{t('admin.transactions.table.amount')}</TableHead>
                        <TableHead>{t('admin.transactions.table.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id}</TableCell>
                          <TableCell>{usersById.get(order.buyerId)?.name || order.buyerId}</TableCell>
                          <TableCell>{usersById.get(order.sellerId)?.name || order.sellerId}</TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}