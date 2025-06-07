
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddonCategory } from '@/types';
import { toast } from '@/hooks/use-toast';

export interface ProductAddonManagerRef {
  saveAssociations: (productId: string) => Promise<void>;
}

interface ProductAddonManagerProps {
  productId?: string;
  storeId: string;
  hasAddons: boolean;
  onHasAddonsChange: (enabled: boolean) => void;
}

const ProductAddonManager = forwardRef<ProductAddonManagerRef, ProductAddonManagerProps>(
  ({ productId, storeId, hasAddons, onHasAddonsChange }, ref) => {
    const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchAddonCategories();
      if (productId) {
        fetchProductAddonAssociations();
      }
    }, [storeId, productId]);

    const fetchAddonCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('addon_categories')
          .select(`
            *,
            addon_items (
              id,
              name,
              price,
              is_active
            )
          `)
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        // Transform data to match AddonCategory interface
        const categoriesWithItems = (data || []).filter(category => 
          category.addon_items && category.addon_items.length > 0
        ).map(category => ({
          ...category,
          addon_items: category.addon_items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || undefined,
            price: item.price,
            is_active: item.is_active,
            quantity: item.quantity || undefined
          }))
        }));

        setAddonCategories(categoriesWithItems);
      } catch (error) {
        console.error('Error fetching addon categories:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar categorias de adicionais",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchProductAddonAssociations = async () => {
      if (!productId) return;

      try {
        const { data, error } = await supabase
          .from('product_addon_categories')
          .select('addon_category_id')
          .eq('product_id', productId);

        if (error) throw error;

        const categoryIds = (data || []).map(item => item.addon_category_id);
        setSelectedCategories(categoryIds);
      } catch (error) {
        console.error('Error fetching product addon associations:', error);
      }
    };

    const saveAssociations = async (newProductId: string) => {
      try {
        // Remove existing associations
        if (productId) {
          await supabase
            .from('product_addon_categories')
            .delete()
            .eq('product_id', productId);
        }

        // Add new associations
        if (selectedCategories.length > 0) {
          const associations = selectedCategories.map(categoryId => ({
            product_id: newProductId,
            addon_category_id: categoryId
          }));

          const { error } = await supabase
            .from('product_addon_categories')
            .insert(associations);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error saving addon associations:', error);
        throw error;
      }
    };

    useImperativeHandle(ref, () => ({
      saveAssociations
    }));

    const handleCategoryToggle = (categoryId: string, checked: boolean) => {
      if (checked) {
        setSelectedCategories(prev => [...prev, categoryId]);
      } else {
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!hasAddons) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Categorias de Adicionais</h4>
          <Badge variant="secondary">
            {selectedCategories.length} selecionada(s)
          </Badge>
        </div>

        {addonCategories.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-gray-400 mb-4">
                <Settings className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma categoria de adicional encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                Crie categorias de adicionais primeiro para vinculá-las aos produtos.
              </p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar Categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addonCategories.map((category) => (
              <Card key={category.id} className={`cursor-pointer transition-all ${
                selectedCategories.includes(category.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-gray-300'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium">
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {category.addon_items?.length || 0} item(ns)
                      </span>
                      <div className="flex space-x-2">
                        {category.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                        {category.is_multiple && (
                          <Badge variant="secondary" className="text-xs">
                            Múltipla escolha
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {category.addon_items && category.addon_items.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <p className="truncate">
                          Itens: {category.addon_items.map(item => item.name).join(', ')}
                        </p>
                      </div>
                    )}

                    {(category.min_select || category.max_select) && (
                      <div className="text-xs text-gray-500">
                        {category.min_select && category.max_select ? (
                          <span>Selecione {category.min_select} a {category.max_select}</span>
                        ) : category.min_select ? (
                          <span>Mínimo {category.min_select}</span>
                        ) : category.max_select ? (
                          <span>Máximo {category.max_select}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCategories.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Categorias Selecionadas</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(categoryId => {
                const category = addonCategories.find(c => c.id === categoryId);
                return category ? (
                  <Badge key={categoryId} variant="secondary">
                    {category.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ProductAddonManager.displayName = 'ProductAddonManager';

export { ProductAddonManager };
