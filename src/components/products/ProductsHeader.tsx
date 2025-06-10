
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Package, Clock, MapPin } from 'lucide-react';
import { Store as StoreType } from '@/types';

interface ProductsHeaderProps {
  onAddProduct: () => void;
  store?: StoreType; // Tornar opcional
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ onAddProduct, store }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
            Gerenciar Produtos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Gerencie todos os produtos da sua loja de forma eficiente e organizada
          </p>
        </div>
        
        <Button 
          id="btn-novo-produto"
          onClick={() => {
            console.log('[ProductsHeader] Botão Novo Produto clicado');
            console.log('[ProductsHeader] onAddProduct function:', typeof onAddProduct);
            if (onAddProduct) {
              console.log('[ProductsHeader] Chamando onAddProduct do parent');
              onAddProduct();
            } else {
              console.error('[ProductsHeader] onAddProduct não está definido!');
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {store && (
        <Card className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
                  <Store className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">{store.name}</h3>
                  <p className="text-gray-600">{store.description || 'Sua loja principal'}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{store.address || 'Endereço não informado'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="flex items-center gap-2 px-3 py-2">
                  <Clock className="h-4 w-4" />
                  {store.opening_hours || 'Horário não informado'}
                </Badge>
                <Badge 
                  variant={store.is_active ? "default" : "destructive"} 
                  className="px-3 py-2"
                >
                  {store.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductsHeader;
