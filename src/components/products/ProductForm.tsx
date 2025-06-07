
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product, Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SimpleImageUpload from './SimpleImageUpload';
import ProductBasicInfo from './form/ProductBasicInfo';
import ProductPricing from './form/ProductPricing';
import ProductIngredients from './form/ProductIngredients';
import ProductSettings from './form/ProductSettings';

interface ProductImage {
  url: string;
  is_primary: boolean;
  order: number;
}

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  storeId: string;
  onClose: () => void;
  onSave: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  storeId,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sale_price: 0,
    category_id: '',
    is_featured: false,
    is_available: true,
    is_active: true,
    has_addons: false,
    preparation_time: 0,
    allow_same_day_scheduling: false
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        sale_price: product.sale_price || 0,
        category_id: product.category_id,
        is_featured: product.is_featured,
        is_available: product.is_available,
        is_active: product.is_active,
        has_addons: product.has_addons || false,
        preparation_time: product.preparation_time || 0,
        allow_same_day_scheduling: product.allow_same_day_scheduling || false
      });

      if (product.image_url) {
        setImages([{
          url: product.image_url,
          is_primary: true,
          order: 0
        }]);
      } else {
        setImages([]);
      }

      setIngredients(product.ingredients || []);
      setAllergens(product.allergens || []);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        sale_price: 0,
        category_id: categories.length > 0 ? categories[0].id : '',
        is_featured: false,
        is_available: true,
        is_active: true,
        has_addons: false,
        preparation_time: 0,
        allow_same_day_scheduling: false
      });
      setImages([]);
      setIngredients([]);
      setAllergens([]);
    }
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do produto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category_id) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Erro",
        description: "Preço deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const primaryImage = images.find(img => img.is_primary);
      const imageUrl = primaryImage ? primaryImage.url : null;

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: Number(formData.price),
        sale_price: formData.sale_price > 0 ? Number(formData.sale_price) : null,
        category_id: formData.category_id,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        is_active: formData.is_active,
        has_addons: formData.has_addons,
        preparation_time: formData.preparation_time || null,
        allow_same_day_scheduling: formData.allow_same_day_scheduling,
        image_url: imageUrl,
        ingredients: ingredients.length > 0 ? ingredients : null,
        allergens: allergens.length > 0 ? allergens : null,
        store_id: storeId
      };

      if (product?.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Produto atualizado!",
          description: "As alterações foram salvas com sucesso."
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Produto criado!",
          description: "O produto foi criado com sucesso."
        });
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {product?.id ? 'Editar' : 'Novo'} Produto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          <ProductBasicInfo
            formData={formData}
            categories={categories}
            onFormDataChange={setFormData}
          />

          <ProductPricing
            formData={formData}
            onFormDataChange={setFormData}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Imagens do Produto
            </h3>
            <SimpleImageUpload
              images={images}
              onImagesChange={setImages}
              storeId={storeId}
            />
          </div>

          <ProductIngredients
            ingredients={ingredients}
            allergens={allergens}
            onIngredientsChange={setIngredients}
            onAllergensChange={setAllergens}
          />

          <ProductSettings
            formData={formData}
            onFormDataChange={setFormData}
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
