
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, UserX, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@/hooks/useUsers';

interface UsersTableProps {
  users: User[];
  onUpdateRole: (userId: string, role: string) => void;
  onEditUser: (user: User) => void;
  onDeactivateUser: (userId: string) => void;
}

const getRoleBadgeVariant = (role: string | null) => {
  switch (role) {
    case 'admin': return 'destructive';
    case 'engineer': return 'default';
    case 'planner': return 'secondary';
    case 'viewer': return 'outline';
    case 'inactive': return 'destructive';
    default: return 'outline';
  }
};

const getRoleDisplayName = (role: string | null) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'engineer': return 'Engineer';
    case 'planner': return 'Planner';
    case 'viewer': return 'Viewer';
    case 'inactive': return 'Inactive';
    default: return 'Unknown';
  }
};

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onUpdateRole,
  onEditUser,
  onDeactivateUser
}) => {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await onUpdateRole(userId, newRole);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.full_name || 'Unknown User'}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  {user.role !== 'inactive' && (
                    <Select
                      value={user.role || ''}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updatingUserId === user.id}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="planner">Planner</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.company || 'N/A'}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </DropdownMenuItem>
                    {user.role !== 'inactive' && (
                      <DropdownMenuItem 
                        onClick={() => onDeactivateUser(user.id)}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
