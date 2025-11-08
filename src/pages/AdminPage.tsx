import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { User } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const fetchedUsers = await api<User[]>('/api/users');
        setUsers(fetchedUsers);
      } catch (error) {
        toast.error('Failed to fetch users.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage platform users and settings.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all registered users on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.kycStatus === 'Verified'
                              ? 'default'
                              : user.kycStatus === 'Pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}