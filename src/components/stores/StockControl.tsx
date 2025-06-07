
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StockControlProps {
  products: Array<{
    id: string;
    name: string;
    track_stock?: boolean;
    daily_stock?: number;
    current_stock?: number;
  }>;
  onStockChange: (productId: string, field: string, value: any) => void;
  onBulkUpdate: () => void;
}

const StockControl: React.FC<StockControlProps> = ({
  products,
  onStockChange,
  onBulkUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Controle de Estoque</CardTitle>
          <Button onClick={onBulkUpdate} variant="outline">
            Atualizar Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">{product.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={product.track_stock ? "default" : "secondary"}>
                  {product.track_stock ? "Controlado" : "Não controlado"}
                </Badge>
                {product.track_stock && (
                  <Badge variant={
                    (product.current_stock || 0) > 0 ? "default" : "destructive"
                  }>
                    Estoque: {product.current_stock || 0}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label>Controlar estoque:</Label>
                <Switch
                  checked={product.track_stock || false}
                  onCheckedChange={(checked) => onStockChange(product.id, 'track_stock', checked)}
                />
              </div>
              
              {product.track_stock && (
                <>
                  <div className="flex items-center space-x-2">
                    <Label>Estoque diário:</Label>
                    <Input
                      type="number"
                      min="0"
                      value={product.daily_stock || 0}
                      onChange={(e) => onStockChange(product.id, 'daily_stock', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Estoque atual:</Label>
                    <Input
                      type="number"
                      min="0"
                      value={product.current_stock || 0}
                      onChange={(e) => onStockChange(product.id, 'current_stock', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Nenhum produto encontrado. Cadastre produtos primeiro.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StockControl;
