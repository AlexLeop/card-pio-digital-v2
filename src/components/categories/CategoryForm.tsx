
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@/types';
import { useStores } from '@/hooks/useStores';
import { Save, X } from 'lucide-react';

interface CategoryFormProps {
  category?: Category;
  onSave: (category: Partial<Category>) => void;
  onCancel: () => void;
}

const CategoryForm = ({ category, onSave, onCancel }: CategoryFormProps) => {
  const { stores } = useStores();
  const [formData, setFormData] = useState<Partial<Category>>({
    name: category?.name || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    store_id: category?.store_id || '',
    parent_id: category?.parent_id || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Category, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validStores = stores.filter(store => store.id);

  return (
    <Card className="max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {category ? 'Editar Categoria' : 'Nova Categoria'}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="store_id">Loja *</Label>
              <Select value={formData.store_id} onValueChange={(value) => handleChange('store_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {validStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva a categoria..."
            />
          </div>

          <div>
            <Label htmlFor="image_url">URL da Imagem</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Ordem de Exibição</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Categoria Ativa</Label>
              <p className="text-sm text-gray-500">A categoria aparecerá no cardápio</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CategoryForm;
