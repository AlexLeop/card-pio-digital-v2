import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, ProductImage, AddonCategory } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { useAddonCategories } from '@/hooks/useAddonCategories';
import { Upload, X, Star, StarOff, Image as ImageIcon, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast'; // ADICIONAR ESTA IMPORTAÇÃO

interface ProductFormProps {
  product?: Product;
  onSave: (productData: Omit<Product, 'id' | 'created_at'>) => Promise<any>;
  onCancel: () => void;
  storeId: string; // Adicionar storeId como prop obrigatória
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel, storeId }) => {
  console.log('ProductForm recebeu storeId:', storeId); // Adicionar esta linha
  const { categories } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    sale_price: product?.sale_price || undefined,
    image_url: product?.image_url || '',
    category_id: product?.category_id || (categories.length > 0 ? categories[0].id : ''),
    store_id: product?.store_id || storeId,
    is_featured: product?.is_featured || false,
    is_available: product?.is_available !== false,
    is_active: product?.is_active !== false,
    has_addons: product?.has_addons || false,
    allow_same_day_scheduling: product?.allow_same_day_scheduling || false,
    preparation_time: product?.preparation_time || undefined,
    daily_stock: product?.daily_stock || undefined,
    current_stock: product?.current_stock || undefined,
    max_included_quantity: product?.max_included_quantity || undefined,
    excess_unit_price: product?.excess_unit_price || undefined,
    min_stock: product?.min_stock || 0,
    track_stock: product?.track_stock || false,
    ingredients: product?.ingredients || [],
    allergens: product?.allergens || [],
    images: product?.images || []
  });
  
  // Mover o hook useAddonCategories para depois da inicialização do formData
  // e usar o store_id diretamente do product prop
  // Usar storeId da prop em vez de product?.store_id
  const { addonCategories } = useAddonCategories(storeId);
  
  const [selectedAddonCategories, setSelectedAddonCategories] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newAllergen, setNewAllergen] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Carregar categorias de addon associadas quando editando um produto
  useEffect(() => {
    const loadProductAddonCategories = async () => {
      if (product?.id) {
        try {
          const { data, error } = await supabase
            .from('product_addon_categories')
            .select('addon_category_id')
            .eq('product_id', product.id);
          
          if (error) {
            console.error('Erro ao carregar categorias de addon do produto:', error);
            return;
          }
          
          const categoryIds = data?.map(item => item.addon_category_id) || [];
          setSelectedAddonCategories(categoryIds);
          console.log('Categorias de addon carregadas para edição:', categoryIds);
        } catch (error) {
          console.error('Erro ao buscar categorias de addon:', error);
        }
      }
    };

    loadProductAddonCategories();
  }, [product?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        store_id: storeId, // Garantir que o store_id seja sempre definido
        sale_price: formData.sale_price > 0 ? formData.sale_price : undefined,
        has_addons: selectedAddonCategories.length > 0,
        selectedAddonCategories // Adicionar as categorias selecionadas
      };
      console.log('Enviando dados do produto com categorias:', productData);
      await onSave(productData);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Criar nome único para o arquivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${storeId}/${fileName}`;

        // Upload para o Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (error) throw error;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return {
          url: publicUrl,
          is_primary: false,
          order: 0
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      // Definir a primeira imagem como principal se não houver imagens
      if (formData.images.length === 0 && uploadedImages.length > 0) {
        uploadedImages[0].is_primary = true;
        updateField('image_url', uploadedImages[0].url);
      }
      
      // Atualizar ordem das imagens
      const updatedImages = uploadedImages.map((img, index) => ({
        ...img,
        order: formData.images.length + index
      }));

      updateField('images', [...formData.images, ...updatedImages]);
      
      toast({
        title: "Sucesso",
        description: `${uploadedImages.length} imagem(ns) enviada(s) com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar imagens. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
    
    // Se removeu a imagem principal, definir a próxima como principal
    if (formData.images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
      updateField('image_url', newImages[0].url);
    } else if (newImages.length === 0) {
      updateField('image_url', '');
    }
  };

  const setPrimaryImage = (index: number) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    updateField('images', newImages);
    updateField('image_url', newImages[index].url);
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

  const toggleAddonCategory = (categoryId: string) => {
    setSelectedAddonCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  console.log('AddonCategories carregadas:', addonCategories);
  console.log('Categorias selecionadas:', selectedAddonCategories);

  return (
    <div className="max-h-[85vh] overflow-y-auto pr-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="addons">Adicionais</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
                      placeholder="Digite o nome do produto"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category_id} onValueChange={(value) => updateField('category_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
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
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Descreva o produto"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparation_time">Tempo de Preparo (minutos)</Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => updateField('preparation_time', Number(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Ingredientes</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      placeholder="Adicionar ingrediente"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                    />
                    <Button type="button" onClick={addIngredient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{ingredient}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeIngredient(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Alérgenos</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newAllergen}
                      onChange={(e) => setNewAllergen(e.target.value)}
                      placeholder="Adicionar alérgeno"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                    />
                    <Button type="button" onClick={addAllergen}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergens.map((allergen, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                        <span>{allergen}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeAllergen(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço Base *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => updateField('price', Number(e.target.value))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Preço Promocional</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => updateField('sale_price', Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_included_quantity">Quantidade Máxima Incluída</Label>
                    <Input
                      id="max_included_quantity"
                      type="number"
                      value={formData.max_included_quantity}
                      onChange={(e) => updateField('max_included_quantity', Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excess_unit_price">Preço por Unidade Excedente</Label>
                    <Input
                      id="excess_unit_price"
                      type="number"
                      step="0.01"
                      value={formData.excess_unit_price}
                      onChange={(e) => updateField('excess_unit_price', Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Imagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL da Imagem Principal</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingImage ? 'Enviando...' : 'Enviar Múltiplas Imagens'}
                  </Button>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                          <img
                            src={image.url}
                            alt={`Produto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={image.is_primary ? "default" : "outline"}
                            onClick={() => setPrimaryImage(index)}
                            className="h-8 w-8 p-0"
                          >
                            {image.is_primary ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {image.is_primary && (
                          <Badge className="absolute bottom-2 left-2" variant="default">
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {formData.images.length === 0 && formData.image_url && (
                  <div className="flex justify-center">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {formData.images.length === 0 && !formData.image_url && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhuma imagem adicionada</p>
                    <p className="text-sm text-gray-400">Adicione uma URL ou faça upload de uma imagem</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_stock"
                    checked={formData.track_stock}
                    onCheckedChange={(checked) => updateField('track_stock', checked)}
                  />
                  <Label htmlFor="track_stock">Controlar estoque</Label>
                </div>

                {formData.track_stock && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stock_quantity">Estoque Total</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min="0"
                          value={formData.daily_stock || 0}
                          onChange={(e) => updateField('daily_stock', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Estoque geral do produto
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="min_stock">Estoque Mínimo</Label>
                        <Input
                          id="min_stock"
                          type="number"
                          min="0"
                          value={formData.min_stock}
                          onChange={(e) => updateField('min_stock', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Alerta quando estoque estiver baixo
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="has_addons"
                    checked={formData.has_addons}
                    onCheckedChange={(checked) => updateField('has_addons', checked)}
                  />
                  <Label htmlFor="has_addons">Este produto possui adicionais</Label>
                </div>

                {formData.has_addons && (
                  <div className="space-y-3">
                    <Label>Selecione as categorias de adicionais:</Label>
                    {addonCategories.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm mb-2">
                          Nenhuma categoria de adicional encontrada.
                        </p>
                        <p className="text-gray-400 text-xs">
                          Crie categorias de adicionais primeiro na seção "Adicionais".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {addonCategories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                            <Checkbox
                              id={`addon-${category.id}`}
                              checked={selectedAddonCategories.includes(category.id)}
                              onCheckedChange={() => toggleAddonCategory(category.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`addon-${category.id}`} className="font-medium cursor-pointer">
                                {category.name}
                              </Label>
                              {category.description && (
                                <p className="text-sm text-gray-500">{category.description}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                {category.is_required && (
                                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                )}
                                {category.is_multiple && (
                                  <Badge variant="secondary" className="text-xs">Múltipla seleção</Badge>
                                )}
                                {category.is_order_bump && (
                                  <Badge variant="outline" className="text-xs">Order Bump</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedAddonCategories.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Categorias selecionadas ({selectedAddonCategories.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAddonCategories.map(categoryId => {
                            const category = addonCategories.find(c => c.id === categoryId);
                            return category ? (
                              <Badge key={categoryId} variant="default" className="text-xs">
                                {category.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow_same_day_scheduling"
                    checked={formData.allow_same_day_scheduling}
                    onCheckedChange={(checked) => updateField('allow_same_day_scheduling', checked)}
                  />
                  <Label htmlFor="allow_same_day_scheduling">Permitir agendamento no mesmo dia</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Status do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField('is_active', checked)}
                />
                <Label htmlFor="is_active">Produto ativo</Label>
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
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => updateField('is_featured', checked)}
                />
                <Label htmlFor="is_featured">Produto em destaque</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4 border-t sticky bottom-0 bg-white">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
