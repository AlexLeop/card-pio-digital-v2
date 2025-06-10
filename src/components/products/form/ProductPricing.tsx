
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ProductPricingProps {
  formData: {
    price: number;
    sale_price: number;
  };
  onFormDataChange: (data: any) => void;
}

const ProductPricing: React.FC<ProductPricingProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Preços</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => onFormDataChange({ 
              ...formData, 
              price: parseFloat(e.target.value) || 0 
            })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale_price">Preço Promocional (R$)</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.sale_price}
            onChange={(e) => onFormDataChange({ 
              ...formData, 
              sale_price: parseFloat(e.target.value) || 0 
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductPricing;
