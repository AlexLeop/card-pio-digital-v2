import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStockManager } from '@/hooks/useStockManager';
import { toast } from '@/hooks/use-toast';

interface StockAlertsProps {
  storeId: string;
  onDismiss?: () => void;
}

const StockAlerts: React.FC<StockAlertsProps> = ({ storeId, onDismiss }) => {
  const { products } = useProducts(storeId);
  const { getAvailableStock } = useStockManager(products);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const lowStockProducts = products.filter(product => {
    if (!product.daily_stock || dismissedAlerts.includes(product.id)) return false;
    
    const available = getAvailableStock(product.id);
    return available <= (product.daily_stock * 0.2) && available > 0;
  });

  const outOfStockProducts = products.filter(product => {
    if (!product.daily_stock || dismissedAlerts.includes(product.id)) return false;
    
    return getAvailableStock(product.id) <= 0;
  });

  const handleDismissAlert = (productId: string) => {
    setDismissedAlerts(prev => [...prev, productId]);
  };

  const handleDismissAll = () => {
    const allAlertIds = [...lowStockProducts, ...outOfStockProducts].map(p => p.id);
    setDismissedAlerts(prev => [...prev, ...allAlertIds]);
    onDismiss?.();
  };

  // Notificação automática quando produtos ficam com estoque baixo
  useEffect(() => {
    if (lowStockProducts.length > 0) {
      toast({
        title: "Alerta de Estoque",
        description: `${lowStockProducts.length} produto(s) com estoque baixo.`,
        variant: "destructive"
      });
    }
  }, [lowStockProducts.length]);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alertas de Estoque Esgotado */}
      {outOfStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Produtos Esgotados ({outOfStockProducts.length})</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismissAll}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {outOfStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-center justify-between">
                  <span className="text-sm">{product.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">Esgotado</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissAlert(product.id)}
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {outOfStockProducts.length > 3 && (
                <p className="text-sm text-gray-600">
                  +{outOfStockProducts.length - 3} outros produtos esgotados
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Estoque Baixo ({lowStockProducts.length})</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismissAll}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {lowStockProducts.slice(0, 3).map(product => {
                const available = getAvailableStock(product.id);
                return (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm">{product.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {available} restantes
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissAlert(product.id)}
                        className="h-5 w-5 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-gray-600">
                  +{lowStockProducts.length - 3} outros produtos com estoque baixo
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default StockAlerts;