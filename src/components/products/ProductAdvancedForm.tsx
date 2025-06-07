
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, Clock, Settings } from 'lucide-react';
import { Product, AddonCategory, ProductImage } from '@/types';
import ImageUpload from './ImageUpload';

interface ProductAdvancedFormProps {
  product?: Product;
  addonCategories: AddonCategory[];
  onSave: (productData: Partial<Product>) => void;
  onCancel: () => void;
}

const ProductAdvancedForm: React.FC<ProductAdvancedFormProps> = ({
  product,
  addonCategories,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    sale_price: product?.sale_price || undefined,
    image_url: product?.image_url || '',
    is_featured: product?.is_featured || false,
    is_available: product?.is_available || true,
    is_active: product?.is_active || true,
    has_addons: product?.has_addons || false,
    allow_same_day_scheduling: product?.allow_same_day_scheduling || false,
    preparation_time: product?.preparation_time || undefined,
    // Configurações de estoque
    daily_stock: product?.daily_stock || undefined,
    current_stock: product?.current_stock || undefined,
    max_included_quantity: product?.max_included_quantity || undefined,
    excess_unit_price: product?.excess_unit_price || undefined,
    // Ingredientes e alérgenos
    ingredients: product?.ingredients || [],
    allergens: product?.allergens || []
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [newAllergen, setNewAllergen] = useState('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      updateField('ingredients', [...formData.ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    updateField('ingredients', formData.ingredients.filter((_, i) => i !== index));
  };

  const addAllergen = () => {
    if (newAllergen.trim()) {
      updateField('allergens', [...formData.allergens, newAllergen.trim()]);
      setNewAllergen('');
    }
  };

  const removeAllergen = (index: number) => {
    updateField('allergens', formData.allergens.filter((_, i) => i !== index));
  };

  // Adicionar estado para imagens
  const [images, setImages] = useState<ProductImage[]>(
    product?.images || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Incluir imagens nos dados salvos
    const cleanedData = {
      ...formData,
      images: images,
      sale_price: formData.sale_price || undefined,
      preparation_time: formData.preparation_time || undefined,
      daily_stock: formData.daily_stock || undefined,
      current_stock: formData.current_stock || undefined,
      max_included_quantity: formData.max_included_quantity || undefined,
      excess_unit_price: formData.excess_unit_price || undefined
    };

    onSave(cleanedData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
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
                  value={formData.sale_price || ''}
                  onChange={(e) => updateField('sale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => updateField('is_featured', checked)}
                />
                <Label htmlFor="is_featured">Produto em Destaque</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => updateField('is_available', checked)}
                />
                <Label htmlFor="is_available">Disponível</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField('is_active', checked)}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Controle de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_stock">Estoque Diário</Label>
                <Input
                  id="daily_stock"
                  type="number"
                  min="0"
                  placeholder="Ilimitado"
                  value={formData.daily_stock || ''}
                  onChange={(e) => updateField('daily_stock', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <p className="text-xs text-gray-500">
                  Quantidade disponível por dia (deixe vazio para ilimitado)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock">Estoque Atual</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock || ''}
                  onChange={(e) => updateField('current_stock', e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={!formData.daily_stock}
                />
                <p className="text-xs text-gray-500">
                  Quantidade disponível agora
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_included_quantity">Quantidade Máxima Incluída</Label>
                <Input
                  id="max_included_quantity"
                  type="number"
                  min="1"
                  placeholder="Sem limite"
                  value={formData.max_included_quantity || ''}
                  onChange={(e) => updateField('max_included_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <p className="text-xs text-gray-500">
                  Quantidade incluída no preço base
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excess_unit_price">Preço por Unidade Excedente (R$)</Label>
                <Input
                  id="excess_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.excess_unit_price || ''}
                  onChange={(e) => updateField('excess_unit_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={!formData.max_included_quantity}
                />
                <p className="text-xs text-gray-500">
                  Valor cobrado por cada unidade adicional
                </p>
              </div>
            </div>

            {formData.max_included_quantity && formData.excess_unit_price && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Exemplo de Cobrança:</h4>
                <p className="text-blue-800 text-sm">
                  <strong>Preço base:</strong> R$ {formData.price.toFixed(2)} (até {formData.max_included_quantity} unidade{formData.max_included_quantity > 1 ? 's' : ''})
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Excedente:</strong> R$ {formData.excess_unit_price.toFixed(2)} por unidade adicional
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Agendamento e Preparo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparation_time">Tempo de Preparo (minutos)</Label>
                <Input
                  id="preparation_time"
                  type="number"
                  min="0"
                  value={formData.preparation_time || ''}
                  onChange={(e) => updateField('preparation_time', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_same_day_scheduling"
                  checked={formData.allow_same_day_scheduling}
                  onCheckedChange={(checked) => updateField('allow_same_day_scheduling', checked)}
                />
                <Label htmlFor="allow_same_day_scheduling">Permitir Agendamento no Mesmo Dia</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configurações de Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="has_addons"
                checked={formData.has_addons}
                onCheckedChange={(checked) => updateField('has_addons', checked)}
              />
              <Label htmlFor="has_addons">Este produto aceita adicionais</Label>
            </div>

            {formData.has_addons && addonCategories.length > 0 && (
              <div className="p-3 bg-gray-50 border rounded-lg">
                <h4 className="font-medium mb-2">Categorias de Adicionais Disponíveis:</h4>
                <div className="flex flex-wrap gap-2">
                  {addonCategories.map(category => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configure as categorias de adicionais na seção "Adicionais"
                </p>
              </div>
            )}

            {formData.has_addons && addonCategories.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Nenhuma categoria de adicional encontrada. Configure primeiro as categorias de adicionais.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingredientes e Alérgenos */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes e Alérgenos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Ingredientes</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="Digite um ingrediente"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                  />
                  <Button type="button" onClick={addIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{ingredient}</span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Alérgenos</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="Digite um alérgeno"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                  />
                  <Button type="button" onClick={addAllergen}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                      <span>{allergen}</span>
                      <button
                        type="button"
                        onClick={() => removeAllergen(index)}
                        className="ml-1 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {product ? 'Atualizar Produto' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductAdvancedForm;
