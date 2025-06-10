
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Package, ShoppingCart, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const StatsCards = () => {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    ordersToday: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total de lojas
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      // Total de produtos
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Pedidos de hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // Use orders count for customers temporarily since customers table isn't available
      const { count: customersCount } = await supabase
        .from('orders')
        .select('customer_name', { count: 'exact', head: true });

      setStats({
        totalStores: storesCount || 0,
        totalProducts: productsCount || 0,
        ordersToday: ordersCount || 0,
        totalCustomers: customersCount || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const statsData = [
    {
      title: 'Total de Lojas',
      value: stats.totalStores.toString(),
      icon: Store,
      color: 'text-blue-600'
    },
    {
      title: 'Produtos',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-green-600'
    },
    {
      title: 'Pedidos Hoje',
      value: stats.ordersToday.toString(),
      icon: ShoppingCart,
      color: 'text-purple-600'
    },
    {
      title: 'Clientes',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
