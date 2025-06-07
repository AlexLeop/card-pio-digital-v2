
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UpsellProduct } from '@/types';

interface UpsellSectionProps {
  products: UpsellProduct[];
  onAddProduct: (product: UpsellProduct) => void;
}

const UpsellSection: React.FC<UpsellSectionProps> = ({ products, onAddProduct }) => {
  if (products.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Que tal adicionar?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                {product.description && (
                  <p className="text-sm text-gray-600">{product.description}</p>
                )}
                <p className="text-lg font-bold text-primary">
                  R$ {product.price.toFixed(2)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onAddProduct(product)}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpsellSection;
