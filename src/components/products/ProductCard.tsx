
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Package, Star, Clock, DollarSign } from 'lucide-react';
import { Product, Category } from '@/types';

interface ProductCardProps {
  product: Product;
  category: Category | undefined;
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  category,
  onEdit,
  onView
}) => {
  // Função para obter a imagem principal
  const getMainImage = () => {
    if (product.images && product.images.length > 0) {
      // Procurar pela imagem marcada como principal
      const primaryImage = product.images.find(img => img.is_primary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return product.image_url;
  };

  const mainImageUrl = getMainImage();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden">
      <div className="relative">
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback para image_url se a imagem do array falhar
              if (e.currentTarget.src !== product.image_url && product.image_url) {
                e.currentTarget.src = product.image_url;
              }
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {product.is_featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-600">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
        
        {product.sale_price && (
          <Badge variant="destructive" className="absolute top-3 right-3">
            Promoção
          </Badge>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Indisponível
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {category?.name || 'Sem categoria'}
            </Badge>
            
            {product.preparation_time && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {product.preparation_time}min
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.sale_price ? (
                <>
                  <span className="text-lg font-bold text-green-600">
                    R$ {product.sale_price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(product)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
              {product.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            
            {product.has_addons && (
              <Badge variant="outline" className="text-xs">
                Adicionais
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
