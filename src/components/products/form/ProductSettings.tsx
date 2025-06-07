
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface ProductSettingsProps {
  formData: {
    preparation_time: number;
    is_featured: boolean;
    is_available: boolean;
    is_active: boolean;
    allow_same_day_scheduling: boolean;
  };
  onFormDataChange: (data: any) => void;
}

const ProductSettings: React.FC<ProductSettingsProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preparation_time">Tempo de Preparo (minutos)</Label>
          <Input
            id="preparation_time"
            type="number"
            min="0"
            value={formData.preparation_time}
            onChange={(e) => onFormDataChange({ 
              ...formData, 
              preparation_time: parseInt(e.target.value) || 0 
            })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => onFormDataChange({ 
              ...formData, 
              is_featured: checked 
            })}
          />
          <Label htmlFor="is_featured">Produto em destaque</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_available"
            checked={formData.is_available}
            onCheckedChange={(checked) => onFormDataChange({ 
              ...formData, 
              is_available: checked 
            })}
          />
          <Label htmlFor="is_available">Produto disponível</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onFormDataChange({ 
              ...formData, 
              is_active: checked 
            })}
          />
          <Label htmlFor="is_active">Produto ativo</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="allow_same_day_scheduling"
            checked={formData.allow_same_day_scheduling}
            onCheckedChange={(checked) => onFormDataChange({ 
              ...formData, 
              allow_same_day_scheduling: checked 
            })}
          />
          <Label htmlFor="allow_same_day_scheduling">Permitir agendamento no mesmo dia</Label>
        </div>
      </div>
    </div>
  );
};

export default ProductSettings;
