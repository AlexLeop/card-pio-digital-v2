
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import ProductViewModal from './ProductViewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface ProductsListProps {
  products: Product[];
  onAddProduct: (productData: Omit<Product, 'id' | 'created_at'>) => Promise<any>;
  onEditProduct: (productId: string, productData: Partial<Product> & { selectedAddonCategories?: string[] }) => Promise<any>;
  onViewProduct: (product: Product) => void;
  storeId: string;
}

const ProductsList = ({ products, onAddProduct, onEditProduct, onViewProduct, storeId }: ProductsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && product.is_active) ||
                         (filterActive === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const handleSaveNewProduct = async (productData: any) => {
    try {
      console.log('Salvando novo produto com dados:', productData);
      await onAddProduct({
        ...productData,
        store_id: storeId,
        selectedAddonCategories: productData.selectedAddonCategories || []
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleViewProductLocal = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProductLocal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (productData: Omit<Product, 'id' | 'created_at'> & { selectedAddonCategories?: string[] }) => {
    if (selectedProduct) {
      try {
        console.log('Editando produto com dados:', productData);
        await onEditProduct(selectedProduct.id, productData);
        setIsEditModalOpen(false);
        setSelectedProduct(null);
      } catch (error) {
        console.error("Erro ao editar produto:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Gerenciar Produtos</span>
              <Badge variant="secondary">{products.length}</Badge>
            </CardTitle>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Novo Produto</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do novo produto
                  </DialogDescription>
                </DialogHeader>
                <ProductForm 
                  onSave={handleSaveNewProduct} 
                  onCancel={() => setIsAddModalOpen(false)}
                  storeId={storeId} // Passar storeId para o ProductForm
                />
              </DialogContent>
            </Dialog>
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
              <Button
                variant={filterActive === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActive('all')}
              >
                <Filter className="h-4 w-4 mr-1" />
                Todos
              </Button>
              <Button
                variant={filterActive === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActive('active')}
              >
                Ativos
              </Button>
              <Button
                variant={filterActive === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActive('inactive')}
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
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
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProductLocal}
              onView={handleViewProductLocal}
            />
          ))}
        </div>
      )}

      {/* Modal de Visualização */}
      {isViewModalOpen && selectedProduct && (
        <ProductViewModal
          product={selectedProduct}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedProduct(null);
          }}
          onEdit={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {/* Modal de Edição */}
      {isEditModalOpen && selectedProduct && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Edite as informações do produto
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <ProductForm 
                product={selectedProduct} 
                onSave={handleSaveEditProduct} 
                onCancel={() => setIsEditModalOpen(false)}
                storeId={storeId} // Passar storeId para o ProductForm
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductsList;
