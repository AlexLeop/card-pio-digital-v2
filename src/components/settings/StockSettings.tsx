
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product } from '@/types';

interface StockSettingsProps {
  products: Product[];
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onResetAllStock: () => void;
}

const StockSettings: React.FC<StockSettingsProps> = ({
  products,
  onUpdateProduct,
  onResetAllStock
}) => {
  const updateProductStock = (productId: string, field: string, value: any) => {
    onUpdateProduct(productId, { [field]: value });
  };

  const getTotalProducts = () => products.length;
  const getProductsWithStock = () => products.filter(p => p.daily_stock !== undefined).length;
  const getOutOfStockProducts = () => products.filter(p => p.daily_stock !== undefined && (p.current_stock || 0) <= 0).length;

  return (
    <div className="space-y-6">
      {/* Resumo do Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Resumo do Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{getTotalProducts()}</div>
              <div className="text-sm text-gray-600">Total de Produtos</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getProductsWithStock()}</div>
              <div className="text-sm text-gray-600">Com Controle de Estoque</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{getOutOfStockProducts()}</div>
              <div className="text-sm text-gray-600">Sem Estoque</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Button onClick={onResetAllStock} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações por Produto */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Estoque por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {product.daily_stock !== undefined && (
                      <Badge variant={
                        (product.current_stock || 0) > 0 ? "default" : "destructive"
                      }>
                        {product.current_stock || 0} / {product.daily_stock}
                      </Badge>
                    )}
                    
                    {product.daily_stock === undefined && (
                      <Badge variant="secondary">Estoque Ilimitado</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Estoque Diário */}
                  <div className="space-y-2">
                    <Label htmlFor={`daily_stock_${product.id}`}>Estoque Diário</Label>
                    <Input
                      id={`daily_stock_${product.id}`}
                      type="number"
                      min="0"
                      placeholder="Ilimitado"
                      value={product.daily_stock || ''}
                      onChange={(e) => updateProductStock(
                        product.id, 
                        'daily_stock', 
                        e.target.value ? parseInt(e.target.value) : undefined
                      )}
                    />
                    <p className="text-xs text-gray-500">
                      Deixe vazio para estoque ilimitado
                    </p>
                  </div>

                  {/* Estoque Atual */}
                  <div className="space-y-2">
                    <Label htmlFor={`current_stock_${product.id}`}>Estoque Atual</Label>
                    <Input
                      id={`current_stock_${product.id}`}
                      type="number"
                      min="0"
                      value={product.current_stock || 0}
                      onChange={(e) => updateProductStock(
                        product.id, 
                        'current_stock', 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={product.daily_stock === undefined}
                    />
                    <p className="text-xs text-gray-500">
                      Quantidade disponível hoje
                    </p>
                  </div>

                  {/* Quantidade Máxima Incluída */}
                  <div className="space-y-2">
                    <Label htmlFor={`max_included_${product.id}`}>Quantidade Máxima Incluída</Label>
                    <Input
                      id={`max_included_${product.id}`}
                      type="number"
                      min="0"
                      placeholder="Sem limite"
                      value={product.max_included_quantity || ''}
                      onChange={(e) => updateProductStock(
                        product.id, 
                        'max_included_quantity', 
                        e.target.value ? parseInt(e.target.value) : undefined
                      )}
                    />
                    <p className="text-xs text-gray-500">
                      Quantidade incluída no preço base
                    </p>
                  </div>
                </div>

                {/* Preço por Excedente */}
                {product.max_included_quantity && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`excess_price_${product.id}`}>Preço por Unidade Excedente (R$)</Label>
                      <Input
                        id={`excess_price_${product.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.excess_unit_price || ''}
                        onChange={(e) => updateProductStock(
                          product.id, 
                          'excess_unit_price', 
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )}
                      />
                      <p className="text-xs text-gray-500">
                        Valor cobrado por cada unidade além do limite
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Exemplo de Cobrança</Label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p><strong>Preço base:</strong> R$ {product.price.toFixed(2)} (até {product.max_included_quantity} un.)</p>
                        {product.excess_unit_price && (
                          <p><strong>Excedente:</strong> R$ {product.excess_unit_price.toFixed(2)} por unidade adicional</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alertas */}
                {product.daily_stock !== undefined && (product.current_stock || 0) <= 0 && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 text-sm">Produto sem estoque</span>
                  </div>
                )}
              </div>
            ))}

            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum produto cadastrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSettings;
