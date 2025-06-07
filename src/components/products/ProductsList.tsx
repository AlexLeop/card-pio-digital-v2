
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Edit, Eye, Package, AlertTriangle } from 'lucide-react';
import { Product, Category } from '@/types';
import ProductAdvancedForm from './ProductAdvancedForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProductsListProps {
  products: Product[];
  categories: Category[];
  storeId: string;
  loading: boolean;
  error: string | null;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onRefresh: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({
  products,
  categories,
  storeId,
  loading,
  error,
  onAddProduct,
  onEditProduct,
  onViewProduct,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    
    const matchesStock = filterStock === 'all' || 
                        (filterStock === 'in_stock' && (!product.daily_stock || (product.current_stock || 0) > 0)) ||
                        (filterStock === 'out_of_stock' && product.daily_stock && (product.current_stock || 0) <= 0) ||
                        (filterStock === 'unlimited' && !product.daily_stock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAdvancedForm(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      // Here you would save the product data
      console.log('Saving product:', productData);
      setShowAdvancedForm(false);
      setEditingProduct(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const getStockStatus = (product: Product) => {
    if (!product.daily_stock) {
      return { label: 'Ilimitado', variant: 'secondary' as const };
    }
    
    const current = product.current_stock || 0;
    
    if (current <= 0) {
      return { label: 'Sem estoque', variant: 'destructive' as const };
    }
    
    if (current <= product.daily_stock * 0.2) {
      return { label: 'Estoque baixo', variant: 'destructive' as const };
    }
    
    return { label: `${current}/${product.daily_stock}`, variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Produtos</span>
              <Badge variant="secondary">{products.length}</Badge>
            </CardTitle>
            <Button onClick={onAddProduct} className="gradient-bg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todo estoque</option>
                <option value="in_stock">Em estoque</option>
                <option value="out_of_stock">Sem estoque</option>
                <option value="unlimited">Ilimitado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-gray-500">
              {products.length === 0 ? (
                <div>
                  <p className="text-lg mb-2">Nenhum produto cadastrado</p>
                  <p>Comece criando seu primeiro produto</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Nenhum produto encontrado</p>
                  <p>Tente ajustar os filtros de busca</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_featured && (
                      <Badge className="bg-orange-500">Destaque</Badge>
                    )}
                    {product.sale_price && (
                      <Badge className="bg-red-500">Oferta</Badge>
                    )}
                    {!product.is_available && (
                      <Badge variant="secondary">Indisponível</Badge>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">
                          R$ {(product.sale_price || product.price).toFixed(2)}
                        </span>
                        {product.sale_price && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(product.category_id)}
                      </Badge>
                    </div>

                    {/* Indicadores de configurações avançadas */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {product.has_addons && (
                        <Badge variant="outline" className="text-xs">Adicionais</Badge>
                      )}
                      {product.max_included_quantity && (
                        <Badge variant="outline" className="text-xs">
                          Máx. {product.max_included_quantity}
                        </Badge>
                      )}
                      {product.excess_unit_price && (
                        <Badge variant="outline" className="text-xs">
                          +R$ {product.excess_unit_price.toFixed(2)}
                        </Badge>
                      )}
                      {product.allow_same_day_scheduling && (
                        <Badge variant="outline" className="text-xs">Agendável</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>

                <div className="px-4 pb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProduct(product)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal do Formulário Avançado */}
      {showAdvancedForm && (
        <Dialog open={showAdvancedForm} onOpenChange={setShowAdvancedForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <ProductAdvancedForm
              product={editingProduct || undefined}
              addonCategories={[]} // Você precisará buscar as categorias de adicionais
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowAdvancedForm(false);
                setEditingProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductsList;
