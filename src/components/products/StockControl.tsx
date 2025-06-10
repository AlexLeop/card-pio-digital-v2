import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useStockManager } from '@/hooks/useStockManager';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StockControlProps {
  storeId: string;
}

const StockControl: React.FC<StockControlProps> = ({ storeId }) => {
  const { products, refetch } = useProducts(storeId);
  const { getAvailableStock, resetDailyStock } = useStockManager(products || []);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockUpdates, setStockUpdates] = useState<{ [key: string]: number }>({});

  // Verificação de segurança para products
  if (!products) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  const handleStockUpdate = async (productId: string, newStock: number) => {
    setUpdating(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          daily_stock: newStock,
          current_stock: newStock,
          stock_last_reset: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Estoque atualizado",
        description: `Estoque definido para ${newStock} unidades.`
      });

      refetch();
      setStockUpdates(prev => ({ ...prev, [productId]: newStock }));
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleResetAllStock = async () => {
    try {
      const productsWithStock = products.filter(p => p.daily_stock);
      
      for (const product of productsWithStock) {
        await supabase
          .from('products')
          .update({ 
            current_stock: product.daily_stock,
            stock_last_reset: new Date().toISOString()
          })
          .eq('id', product.id);
      }

      toast({
        title: "Estoque resetado",
        description: "Todos os estoques foram resetados para os valores diários."
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro ao resetar estoque",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const productsWithStock = (products || []).filter(p => p.daily_stock);
  const lowStockProducts = productsWithStock.filter(p => {
    const available = getAvailableStock(p.id);
    return available <= (p.daily_stock! * 0.2);
  });
  const outOfStockProducts = productsWithStock.filter(p => getAvailableStock(p.id) <= 0);

  return (
    <div className="space-y-6">
      {/* Resumo do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">{productsWithStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Esgotados</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={handleResetAllStock}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Estoque
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos com Controle de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productsWithStock.map((product) => {
              const availableStock = getAvailableStock(product.id);
              const isLowStock = availableStock <= (product.daily_stock! * 0.2);
              const isOutOfStock = availableStock <= 0;
              const pendingUpdate = stockUpdates[product.id];

              return (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">
                          Disponível: {availableStock} / {product.daily_stock}
                        </span>
                        {isOutOfStock ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : isLowStock ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Estoque Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disponível</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`stock-${product.id}`} className="text-sm">
                      Novo estoque:
                    </Label>
                    <Input
                      id={`stock-${product.id}`}
                      type="number"
                      min="0"
                      max="999"
                      defaultValue={product.daily_stock}
                      className="w-20"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setStockUpdates(prev => ({ ...prev, [product.id]: value }));
                      }}
                    />
                    <Button
                      onClick={() => handleStockUpdate(product.id, pendingUpdate || product.daily_stock!)}
                      disabled={updating === product.id || !pendingUpdate}
                      size="sm"
                    >
                      {updating === product.id ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockControl;