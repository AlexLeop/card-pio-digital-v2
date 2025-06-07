
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ProductAddonToggleProps {
  hasAddons: boolean;
  onToggle: (enabled: boolean) => void;
}

const ProductAddonToggle: React.FC<ProductAddonToggleProps> = ({
  hasAddons,
  onToggle
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="has-addons"
        checked={hasAddons}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="has-addons">
        Produto possui complementos/adicionais
      </Label>
    </div>
  );
};

export default ProductAddonToggle;
