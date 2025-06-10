import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useStockManager } from '@/hooks/useStockManager';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesData {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  current_stock: number;
  daily_stock: number;
  stock_turnover: number;
}

interface SalesStockReportProps {
  storeId: string;
}

const SalesStockReport: React.FC<SalesStockReportProps> = ({ storeId }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('7');
  const [sortBy, setSortBy] = useState<string>('total_sold');
  
  const { products } = useProducts(storeId);
  const { getAvailableStock } = useStockManager(products);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products!inner(name, daily_stock, current_stock, store_id)
        `)
        .eq('products.store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Agrupar dados por produto
      const groupedData = orderItems?.reduce((acc, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product_id: productId,
            product_name: item.products.name,
            total_sold: 0,
            total_revenue: 0,
            current_stock: getAvailableStock(productId),
            daily_stock: item.products.daily_stock || 0,
            stock_turnover: 0
          };
        }
        
        acc[productId].total_sold += item.quantity;
        acc[productId].total_revenue += item.quantity * item.price;
        
        return acc;
      }, {} as { [key: string]: SalesData });

      // Calcular giro de estoque
      const salesArray = Object.values(groupedData || {}).map(item => ({
        ...item,
        stock_turnover: item.daily_stock > 0 ? (item.total_sold / item.daily_stock) * 100 : 0
      }));

      // Ordenar dados
      salesArray.sort((a, b) => {
        switch (sortBy) {
          case 'total_sold':
            return b.total_sold - a.total_sold;
          case 'total_revenue':
            return b.total_revenue - a.total_revenue;
          case 'stock_turnover':
            return b.stock_turnover - a.stock_turnover;
          case 'current_stock':
            return a.current_stock - b.current_stock;
          default:
            return b.total_sold - a.total_sold;
        }
      });

      setSalesData(salesArray);
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [storeId, dateRange, sortBy, products]);

  const totalSold = salesData.reduce((sum, item) => sum + item.total_sold, 0);
  const totalRevenue = salesData.reduce((sum, item) => sum + item.total_revenue, 0);
  const averageTurnover = salesData.length > 0 
    ? salesData.reduce((sum, item) => sum + item.stock_turnover, 0) / salesData.length 
    : 0;
  const activeProducts = salesData.filter(item => item.total_sold > 0).length;

  const getStockStatus = (currentStock: number, dailyStock: number) => {
    if (currentStock === 0) return { label: 'Esgotado', color: 'bg-red-500' };
    if (currentStock <= dailyStock * 0.2) return { label: 'Baixo', color: 'bg-yellow-500' };
    return { label: 'Normal', color: 'bg-green-500' };
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Relatório de Vendas vs Estoque</h2>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último dia</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total_sold">Mais vendidos</SelectItem>
              <SelectItem value="total_revenue">Maior receita</SelectItem>
              <SelectItem value="stock_turnover">Maior giro</SelectItem>
              <SelectItem value="current_stock">Menor estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Vendido</p>
                <p className="text-2xl font-bold">{totalSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Giro Médio</p>
                <p className="text-2xl font-bold">{averageTurnover.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Detalhado por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado de vendas encontrado para o período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Produto</th>
                    <th className="text-right p-2">Vendido</th>
                    <th className="text-right p-2">Receita</th>
                    <th className="text-right p-2">Giro (%)</th>
                    <th className="text-right p-2">Estoque Atual</th>
                    <th className="text-right p-2">Estoque Diário</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item) => {
                    const stockStatus = getStockStatus(item.current_stock, item.daily_stock);
                    return (
                      <tr key={item.product_id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.product_name}</td>
                        <td className="text-right p-2">{item.total_sold}</td>
                        <td className="text-right p-2">R$ {item.total_revenue.toFixed(2)}</td>
                        <td className="text-right p-2">
                          <div className="flex items-center justify-end space-x-1">
                            <span>{item.stock_turnover.toFixed(1)}%</span>
                            {item.stock_turnover > 50 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="text-right p-2">{item.current_stock}</td>
                        <td className="text-right p-2">{item.daily_stock || 'N/A'}</td>
                        <td className="text-center p-2">
                          <Badge className={`${stockStatus.color} text-white`}>
                            {stockStatus.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Atualização */}
      <div className="flex justify-end">
        <Button onClick={fetchSalesData} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>
    </div>
  );
};

export default SalesStockReport;