import { useState } from 'react';
import { useGetAllUserProfiles, useAssignUserRole } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, ShieldCheck, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../../backend';
import type { Principal } from '@icp-sdk/core/principal';

interface UserWithRole {
  principal: Principal;
  profile: { name: string; role: string } | null;
  effectiveRole: UserRole;
}

export default function UserManagementPage() {
  const { data: users, isLoading } = useGetAllUserProfiles();
  const assignRole = useAssignUserRole();
  const [selectedUser, setSelectedUser] = useState<{ principal: Principal; currentRole: UserRole; targetRole: UserRole } | null>(null);

  const handleRoleChange = (user: UserWithRole, targetRole: UserRole) => {
    setSelectedUser({
      principal: user.principal,
      currentRole: user.effectiveRole,
      targetRole,
    });
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await assignRole.mutateAsync({
        user: selectedUser.principal,
        role: selectedUser.targetRole,
      });
      toast.success(`User role updated to ${selectedUser.targetRole}`);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions for the ADPL system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            View all registered users and manage their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found in the system</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.principal.toString()}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.effectiveRole === UserRole.admin ? (
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.profile?.name || 'Unnamed User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.principal.toString()}
                      </p>
                    </div>
                    <Badge
                      variant={user.effectiveRole === UserRole.admin ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {user.effectiveRole}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {user.effectiveRole === UserRole.admin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user, UserRole.user)}
                        disabled={assignRole.isPending}
                      >
                        Demote to User
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRoleChange(user, UserRole.admin)}
                        disabled={assignRole.isPending}
                      >
                        Promote to Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to change this user's role from{' '}
                  <span className="font-semibold capitalize">{selectedUser.currentRole}</span> to{' '}
                  <span className="font-semibold capitalize">{selectedUser.targetRole}</span>?
                  <br />
                  <br />
                  {selectedUser.targetRole === UserRole.admin ? (
                    <span className="text-orange-600 dark:text-orange-400">
                      This will grant the user full administrative access to the system, including the ability to upload invoices, edit payments, and manage other users.
                    </span>
                  ) : (
                    <span>
                      This will remove administrative privileges. The user will only be able to enter payments and view reports.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={assignRole.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={assignRole.isPending}>
              {assignRole.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
