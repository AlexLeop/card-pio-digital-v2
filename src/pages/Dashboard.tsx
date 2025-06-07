
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store, Package, Users, ShoppingCart } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import RecentOrders from '@/components/dashboard/RecentOrders';
import SalesChart from '@/components/dashboard/SalesChart';
import TopProducts from '@/components/dashboard/TopProducts';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Loja
          </Button>
        </div>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <TopProducts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Ver Clientes
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </CardContent>
        </Card>

        <RecentOrders />
      </div>
    </div>
  );
};

export default Dashboard;
