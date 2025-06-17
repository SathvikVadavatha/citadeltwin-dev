
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useUsers, useUserStats, User } from '@/hooks/useUsers';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UsersTable } from '@/components/users/UsersTable';
import { EditUserModal } from '@/components/users/EditUserModal';
import { UserFilters } from '@/components/users/UserFilters';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export const Users: React.FC = () => {
  const { profile } = useProfile();
  const { users, usersLoading, updateUserRole, updateUserProfile, deactivateUser } = useUsers();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useUserStats();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = profile?.role === 'admin';

  // Filter users based on search term and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleEditUser = (user: User) => {
    if (!isAdmin) {
      toast.error('Only administrators can edit user profiles');
      return;
    }
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserProfile.mutateAsync({ userId, updates });
      setEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can change user roles');
      return;
    }
    await updateUserRole.mutateAsync({ userId, role });
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can deactivate users');
      return;
    }
    if (confirm('Are you sure you want to deactivate this user?')) {
      await deactivateUser.mutateAsync(userId);
    }
  };

  const handleRefresh = () => {
    refetchStats();
  };

  if (usersLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the CitadelTwin platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {isAdmin && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards 
        stats={stats || {
          total: 0,
          admins: 0,
          engineers: 0,
          planners: 0,
          viewers: 0,
          inactive: 0,
          thisMonth: 0
        }} 
        loading={statsLoading}
      />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>
          </div>
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
          />
        </CardHeader>
        <CardContent>
          <UsersTable
            users={filteredUsers}
            onUpdateRole={handleUpdateRole}
            onEditUser={handleEditUser}
            onDeactivateUser={handleDeactivateUser}
          />
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        loading={updateUserProfile.isPending}
      />
    </div>
  );
};
