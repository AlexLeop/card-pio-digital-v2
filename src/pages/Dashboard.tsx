
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, TrendingUp, Package, AlertTriangle, Settings, Store, Users, ShoppingCart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StoreSelector from '@/components/common/StoreSelector';
import PermissionGuard from '@/components/common/PermissionGuard';
import NotificationSettings from '@/components/settings/NotificationSettings';
import StatsCards from '@/components/dashboard/StatsCards';
import StockAlerts from '@/components/common/StockAlerts';
import SalesChart from '@/components/dashboard/SalesChart';
import TopProducts from '@/components/dashboard/TopProducts';
import RecentOrders from '@/components/dashboard/RecentOrders';
import SalesStockReport from '@/components/reports/SalesStockReport';
// Alterar a importação na linha 16
import StockControl from '@/components/products/StockControl';
import StockMovementHistory from '@/components/reports/StockMovementHistory';
import { useNotifications } from '@/hooks/useNotifications';
import { useStores } from '@/hooks/useStores';

const Dashboard = () => {
  const { stores, loading } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Inicializar com a primeira loja disponível quando as lojas carregarem
  useEffect(() => {
    if (!loading && stores.length > 0 && !selectedStoreId) {
      console.log('Inicializando com primeira loja:', stores[0].id); // DEBUG
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, loading, selectedStoreId]);
  
  // Só inicializar notificações quando tiver um storeId válido
  useNotifications(selectedStoreId || undefined);

  // Adicionar log para debug
  console.log('Dashboard - selectedStoreId atual:', selectedStoreId);
  console.log('Dashboard - stores disponíveis:', stores.length);

  return (
    <div className="space-y-6">
      {/* Só renderizar conteúdo quando tiver uma loja selecionada */}
      {selectedStoreId ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <StoreSelector 
                selectedStoreId={selectedStoreId}
                onStoreChange={setSelectedStoreId}
              />
              
              <PermissionGuard permission="canManageUsers">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Loja
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {/* Resto do conteúdo do dashboard */}
          <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            
            <PermissionGuard permission="canViewReports">
              <TabsTrigger value="stock-reports" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Relatórios
              </TabsTrigger>
            </PermissionGuard>
            
            <PermissionGuard permission="canManageStock">
              <TabsTrigger value="stock-control" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Estoque
              </TabsTrigger>
            </PermissionGuard>
            
            <TabsTrigger value="stock-history" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
  
          {/* Aba Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>
  
          {/* Aba Relatórios de Estoque */}
          <PermissionGuard permission="canViewReports">
            <TabsContent value="stock-reports" className="space-y-6">
              <SalesStockReport storeId={selectedStoreId} />
            </TabsContent>
          </PermissionGuard>
  
          {/* Aba Controle de Estoque */}
          <PermissionGuard permission="canManageStock">
            <TabsContent value="stock-control" className="space-y-6">
              <StockControl storeId={selectedStoreId} />
            </TabsContent>
          </PermissionGuard>
  
          {/* Aba Histórico */}
          <TabsContent value="stock-history" className="space-y-6">
            <StockMovementHistory storeId={selectedStoreId} />
          </TabsContent>
  
          {/* Aba Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NotificationSettings storeId={selectedStoreId} />
              
              <PermissionGuard permission="canManageUsers">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Avançadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Configurações adicionais para administradores.
                    </p>
                    <Button variant="outline" className="w-full">
                      Gerenciar Usuários
                    </Button>
                  </CardContent>
                </Card>
              </PermissionGuard>
            </div>
          </TabsContent>
        </Tabs>
        </>
      ) : null}
      
      {!selectedStoreId && !loading && stores.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma loja encontrada. Crie uma loja primeiro.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
