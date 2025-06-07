
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductAddon, AddonCategory } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProductAddonFormProps {
  addon: ProductAddon | null;
  storeId: string;
  categoryId?: string;
  onClose: () => void;
  onSave: () => void;
}

const ProductAddonForm: React.FC<ProductAddonFormProps> = ({
  addon,
  storeId,
  categoryId,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sort_order: 0,
    addon_category_id: categoryId || '',
    max_quantity: '',
    fixed_price_for_max: '',
    excess_unit_price: '',
    is_available: true
  });
  const [categories, setCategories] = useState<AddonCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (addon && addon.id) {
      setFormData({
        name: addon.name || '',
        description: addon.description || '',
        price: addon.price || 0,
        sort_order: addon.sort_order || 0,
        addon_category_id: addon.addon_category_id || categoryId || '',
        max_quantity: addon.max_quantity?.toString() || '',
        fixed_price_for_max: '',
        excess_unit_price: '',
        is_available: addon.is_available !== undefined ? addon.is_available : true
      });
    } else if (categoryId) {
      setFormData(prev => ({ ...prev, addon_category_id: categoryId }));
    }

    fetchCategories();
  }, [addon, storeId, categoryId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('addon_categories')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const addonData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        addon_category_id: formData.addon_category_id || null,
        is_active: formData.is_available
      };

      if (addon?.id) {
        const { error } = await supabase
          .from('addon_items')
          .update(addonData)
          .eq('id', addon.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addon_items')
          .insert([addonData]);

        if (error) throw error;
      }

      toast({
        title: addon?.id ? "Adicional atualizado!" : "Adicional criado!"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar adicional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validCategories = categories.filter(category => category.id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {addon?.id ? 'Editar' : 'Novo'} Adicional
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
                placeholder="Ex: Bacon, Queijo extra, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.addon_category_id} 
                onValueChange={(value) => setFormData({ ...formData, addon_category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {validCategories.map(category => (
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do adicional"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço unitário *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_available">Disponível</Label>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
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

export default ProductAddonForm;
