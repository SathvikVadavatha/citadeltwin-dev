
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, HardHat, MapPin, Eye, UserX, TrendingUp } from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    total: number;
    admins: number;
    engineers: number;
    planners: number;
    viewers: number;
    inactive: number;
    thisMonth: number;
  };
  loading?: boolean;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats, loading }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-600',
    },
    {
      title: 'Administrators',
      value: stats.admins,
      icon: Shield,
      description: 'System administrators',
      color: 'text-red-600',
    },
    {
      title: 'Engineers',
      value: stats.engineers,
      icon: HardHat,
      description: 'Civil engineers',
      color: 'text-green-600',
    },
    {
      title: 'Planners',
      value: stats.planners,
      icon: MapPin,
      description: 'Municipal planners',
      color: 'text-purple-600',
    },
    {
      title: 'Viewers',
      value: stats.viewers,
      icon: Eye,
      description: 'Read-only access',
      color: 'text-gray-600',
    },
    {
      title: 'New This Month',
      value: stats.thisMonth,
      icon: TrendingUp,
      description: 'Recently joined',
      color: 'text-primary',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
