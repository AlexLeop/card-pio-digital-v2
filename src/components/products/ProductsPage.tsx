
import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useStores } from '@/hooks/useStores';
import { Product } from '@/types';
import ProductsList from './ProductsList';
import ProductForm from './ProductForm';
import ProductViewModal from './ProductViewModal';
import ProductsHeader from './ProductsHeader';
import ProductsFilters from './ProductsFilters';
import ProductAdvancedForm from './ProductAdvancedForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const ProductsPage: React.FC = () => {
  const { selectedStore } = useStores();
  const { data: categories = [] } = useCategories(selectedStore?.id || '');
  const { data: products = [], isLoading, error, refetch } = useProducts(selectedStore?.id || '');
  const { addProduct, updateProduct } = useProducts(selectedStore?.id || '');
  
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | Partial<Product>>({});
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  const handleAddProduct = () => {
    console.log('[ProductsPage] handleAddProduct triggered');
    setSelectedProduct({});
    setShowAdvancedForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowAdvancedForm(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewProduct(product);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleCloseAdvancedForm = () => {
    setShowAdvancedForm(false);
    setSelectedProduct(null);
  };

  const handleCloseView = () => {
    setViewProduct(null);
  };

  const handleSave = () => {
    refetch();
    handleCloseForm();
    handleCloseAdvancedForm();
  };

  const handleSaveAdvanced = async (productData: Partial<Product>) => {
    try {
      console.log('[ProductsPage] Salvando produto avançado:', productData);
      
      if (selectedProduct && 'id' in selectedProduct && selectedProduct.id) {
        // Editando produto existente
        await updateProduct({
          ...productData,
          id: selectedProduct.id,
          store_id: selectedStore?.id || ''
        } as Product);
      } else {
        // Criando novo produto
        await addProduct({
          ...productData,
          store_id: selectedStore?.id || ''
        } as Omit<Product, 'id'>);
      }
      
      refetch();
      setShowAdvancedForm(false);
      setSelectedProduct({});
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  if (!selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma loja encontrada</h2>
          <p className="text-gray-600">Crie uma loja primeiro para gerenciar produtos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductsHeader 
          store={selectedStore}
          onAddProduct={handleAddProduct}
        />
        
        <div className="space-y-8">
          <ProductsFilters 
            categories={categories}
            products={products}
          />
          
          <ProductsList
            products={products}
            categories={categories}
            storeId={selectedStore.id}
            loading={loading}
            error={error}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onViewProduct={handleViewProduct}
            onRefresh={refetch}
          />
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          storeId={selectedStore.id}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      <Dialog 
        open={showAdvancedForm} 
        onOpenChange={(isOpen) => {
          console.log('[ProductsPage] Dialog onOpenChange triggered. isOpen:', isOpen);
          if (!isOpen) {
            setShowAdvancedForm(false);
            setSelectedProduct({});
          }
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto" 
          style={{ zIndex: 9999 }}
        >
          <DialogHeader>
            <DialogTitle>
              {Object.keys(selectedProduct).length > 0 && 'id' in selectedProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {Object.keys(selectedProduct).length > 0 && 'id' in selectedProduct 
                ? 'Edite as informações do produto existente' 
                : 'Preencha as informações para criar um novo produto'}
            </DialogDescription>
          </DialogHeader>
          <ProductAdvancedForm
            product={selectedProduct as Product} 
            addonCategories={[]} 
            onSave={handleSaveAdvanced}
            onCancel={handleCloseAdvancedForm}
          />
        </DialogContent>
      </Dialog>

      {viewProduct && (
        <ProductViewModal
          product={viewProduct}
          categories={categories}
          onClose={handleCloseView}
          onEdit={handleEditProduct}
        />
      )}
    </div>
  );
};

export default ProductsPage;
