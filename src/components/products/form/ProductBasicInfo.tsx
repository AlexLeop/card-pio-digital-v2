
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@/types';

interface ProductBasicInfoProps {
  formData: {
    name: string;
    description: string;
    category_id: string;
  };
  categories: Category[];
  onFormDataChange: (data: any) => void;
}

const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({
  formData,
  categories,
  onFormDataChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            required
            placeholder="Nome do produto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category">Categoria *</Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => onFormDataChange({ ...formData, category_id: value })}
          >
            <SelectTrigger id="product-category" name="product-category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
          placeholder="Descrição do produto"
          rows={3}
        />
      </div>
    </div>
  );
};

export default ProductBasicInfo;
