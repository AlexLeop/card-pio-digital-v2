
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProductSales {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

const TopProducts = () => {
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      // Buscar produtos mais vendidos do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          products!inner(name),
          orders!inner(created_at)
        `)
        .gte('orders.created_at', startOfMonth.toISOString());

      if (error) throw error;

      // Agrupar por produto e calcular totais
      const productSales: { [key: string]: ProductSales } = {};
      orderItems?.forEach(item => {
        const productName = item.products?.name || 'Produto sem nome';
        if (!productSales[productName]) {
          productSales[productName] = {
            product_name: productName,
            total_quantity: 0,
            total_revenue: 0
          };
        }
        productSales[productName].total_quantity += item.quantity;
        productSales[productName].total_revenue += Number(item.price) * item.quantity;
      });

      // Converter para array e ordenar por quantidade vendida
      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Produtos Mais Vendidos - Este Mês</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>Nenhum produto vendido este mês</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.product_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-gray-600">
                      {product.total_quantity} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    R$ {product.total_revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Receita total</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProducts;
