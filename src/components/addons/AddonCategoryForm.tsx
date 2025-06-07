
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddonCategory, Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AddonCategoryFormProps {
  addonCategory: AddonCategory | null;
  storeId: string;
  onClose: () => void;
  onSave: () => void;
}

const AddonCategoryForm: React.FC<AddonCategoryFormProps> = ({
  addonCategory,
  storeId,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_required: false,
    is_multiple: false,
    min_select: 1,
    max_select: 1,
    is_order_bump: false,
    sort_order: 0,
    product_id: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (addonCategory && addonCategory.id) {
      setFormData({
        name: addonCategory.name || '',
        description: addonCategory.description || '',
        is_required: addonCategory.is_required || false,
        is_multiple: addonCategory.is_multiple || false,
        min_select: addonCategory.min_select || 1,
        max_select: addonCategory.max_select || 1,
        is_order_bump: addonCategory.is_order_bump || false,
        sort_order: addonCategory.sort_order || 0,
        product_id: addonCategory.product_id || ''
      });
    }

    fetchProducts();
  }, [addonCategory, storeId]);

  const fetchProducts = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      // Map products without accessing non-existent 'images' property
      const mappedProducts: Product[] = (productsData || []).map(product => ({
        ...product,
        name: product.name || '',
        price: product.price || 0,
        store_id: product.store_id || storeId,
        category_id: product.category_id || '',
        is_featured: product.is_featured || false,
        is_available: product.is_available || true,
        is_active: product.is_active || true,
        created_at: product.created_at || new Date().toISOString(),
        images: product.image_url ? [{
          url: product.image_url,
          is_primary: true,
          order: 0
        }] : []
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const categoryData = {
        ...formData,
        store_id: storeId,
        product_id: formData.product_id || null
      };

      if (addonCategory?.id) {
        const { error } = await supabase
          .from('addon_categories')
          .update(categoryData)
          .eq('id', addonCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addon_categories')
          .insert([categoryData]);

        if (error) throw error;
      }

      toast({
        title: addonCategory?.id ? "Categoria atualizada!" : "Categoria criada!"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validProducts = products.filter(product => product.id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {addonCategory?.id ? 'Editar' : 'Nova'} Categoria de Adicional
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Adicionais, Extras, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produto (opcional)</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {validProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da categoria de adicional"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_required">Obrigatório</Label>
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_multiple">Múltipla seleção</Label>
                <Switch
                  id="is_multiple"
                  checked={formData.is_multiple}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_multiple: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_order_bump">Order Bump</Label>
                <Switch
                  id="is_order_bump"
                  checked={formData.is_order_bump}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_order_bump: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min_select">Mínimo de seleções</Label>
                <Input
                  id="min_select"
                  type="number"
                  min="0"
                  value={formData.min_select}
                  onChange={(e) => setFormData({ ...formData, min_select: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_select">Máximo de seleções</Label>
                <Input
                  id="max_select"
                  type="number"
                  min="1"
                  value={formData.max_select}
                  onChange={(e) => setFormData({ ...formData, max_select: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem de exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddonCategoryForm;
