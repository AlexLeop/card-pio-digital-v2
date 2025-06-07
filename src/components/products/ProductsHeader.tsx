
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Package, Clock, MapPin } from 'lucide-react';
import { Store as StoreType } from '@/types';

interface ProductsHeaderProps {
  store: StoreType;
  onAddProduct: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ store, onAddProduct }) => {
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
          onClick={onAddProduct}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </Button>
      </div>

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
                  <span>{store.city || 'Localização não definida'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <Badge 
                variant={store.is_active ? "default" : "secondary"}
                className={`text-sm px-3 py-1 ${
                  store.is_active 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {store.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
              
              <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Horário de Funcionamento</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {store.opening_time && store.closing_time 
                    ? `${store.opening_time} - ${store.closing_time}`
                    : 'Horário não definido'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsHeader;
