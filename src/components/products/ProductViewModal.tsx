
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, Package, Clock, DollarSign, Tag, Calendar, Star } from 'lucide-react';
import { Product, Category } from '@/types';

interface ProductViewModalProps {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onEdit: (product: Product) => void;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  product,
  categories,
  onClose,
  onEdit
}) => {
  const category = categories.find(cat => cat.id === product.category_id);

  const handleEdit = () => {
    onEdit(product);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              {product.name}
            </DialogTitle>
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-gray-600" />
                  Informações Básicas
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-lg font-semibold">{product.name}</p>
                  </div>

                  {product.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Descrição</label>
                      <p className="text-gray-900 mt-1">{product.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Categoria</label>
                    <p className="text-gray-900 mt-1">{category?.name || 'Sem categoria'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Preços
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preço Normal</label>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {product.sale_price && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preço Promocional</label>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {product.sale_price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status e Características</h3>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  
                  <Badge variant={product.is_available ? "default" : "destructive"}>
                    {product.is_available ? 'Disponível' : 'Indisponível'}
                  </Badge>
                  
                  {product.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Em Destaque
                    </Badge>
                  )}
                  
                  {product.has_addons && (
                    <Badge variant="outline">
                      Tem Adicionais
                    </Badge>
                  )}
                  
                  <Badge variant={product.allow_same_day_scheduling ? "default" : "outline"}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {product.allow_same_day_scheduling ? 'Agendamento Mesmo Dia' : 'Agendamento Antecipado'}
                  </Badge>
                </div>

                {product.preparation_time && (
                  <div className="mt-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Tempo de preparo: {product.preparation_time} minutos
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ingredients & Allergens */}
            {(product.ingredients?.length || product.allergens?.length) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Ingredientes e Alérgenos</h3>
                  
                  {product.ingredients && product.ingredients.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Ingredientes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.ingredients.map((ingredient, index) => (
                          <Badge key={index} variant="secondary">
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.allergens && product.allergens.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Alérgenos
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.allergens.map((allergen, index) => (
                          <Badge key={index} variant="destructive">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewModal;
