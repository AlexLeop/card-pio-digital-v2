
import React, { useState, useEffect, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useStores } from '@/hooks/useStores';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2, 
  Package, 
  Store,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import StoreSelector from '@/components/common/StoreSelector';

const ProductsPage: React.FC = () => {
  const { stores, loading: storesLoading } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Inicializar com a primeira loja disponível
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);
  
  const selectedStore = stores.find(store => store.id === selectedStoreId);
  const { data: categories = [] } = useCategories(selectedStoreId || '');
  const { products = [], loading, error, refetch, addProduct, updateProduct, deleteProduct } = useProducts(selectedStoreId || undefined);
  
  // Estados para modais e formulários
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Estados do formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_featured: false,
    is_available: true,
    is_active: true,
    daily_stock: undefined,
    current_stock: undefined,
    ingredients: [],
    allergens: [],
    images: []
  });
  
  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : '',
      is_featured: false,
      is_available: true,
      is_active: true,
      daily_stock: undefined,
      current_stock: undefined,
      ingredients: [],
      allergens: [],
      images: []
    });
  }, [categories]);
  
  // Handlers para modais
  const handleAddProduct = useCallback(() => {
    console.log('🆕 [NOVO] handleAddProduct chamado');
    resetForm();
    setIsAddModalOpen(true);
    console.log('🆕 [NOVO] Modal de adicionar deve abrir:', true);
  }, [resetForm]);
  
  const handleEditProduct = useCallback((product: Product) => {
    console.log('✏️ [NOVO] handleEditProduct chamado:', product.name);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price,
      category_id: product.category_id,
      is_featured: product.is_featured || false,
      is_available: product.is_available ?? true,
      is_active: product.is_active ?? true,
      daily_stock: product.daily_stock,
      current_stock: product.current_stock,
      preparation_time: product.preparation_time,
      max_included_quantity: product.max_included_quantity,
      excess_unit_price: product.excess_unit_price,
      has_addons: product.has_addons,
      allow_same_day_scheduling: product.allow_same_day_scheduling,
      ingredients: product.ingredients || [],
      allergens: product.allergens || [],
      images: product.images || [],
      image_url: product.image_url
    });
    setIsEditModalOpen(true);
    console.log('✏️ [NOVO] Modal de editar deve abrir:', true);
  }, []);
  
  const handleViewProduct = useCallback((product: Product) => {
    console.log('👁️ [NOVO] handleViewProduct chamado:', product.name);
    setSelectedProduct(product);
    setIsViewModalOpen(true);
    console.log('👁️ [NOVO] Modal de visualizar deve abrir:', true);
  }, []);
  
  const handleCloseModals = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  }, [resetForm]);
  
  // Handler para salvar produto
  const handleSaveProduct = useCallback(async () => {
    try {
      if (!formData.name?.trim()) {
        alert('Nome do produto é obrigatório');
        return;
      }
      
      if (!formData.price || formData.price <= 0) {
        alert('Preço deve ser maior que zero');
        return;
      }
      
      if (!formData.category_id) {
        alert('Categoria é obrigatória');
        return;
      }
      
      const productData = {
        ...formData,
        store_id: selectedStoreId,
        price: Number(formData.price),
        // Garantir que todos os campos necessários estão presentes
        sale_price: formData.sale_price ? Number(formData.sale_price) : undefined,
        preparation_time: formData.preparation_time ? Number(formData.preparation_time) : undefined,
        max_included_quantity: formData.max_included_quantity ? Number(formData.max_included_quantity) : undefined,
        excess_unit_price: formData.excess_unit_price ? Number(formData.excess_unit_price) : undefined,
        // Manter valores existentes se não foram alterados
        ...(selectedProduct && {
          has_addons: selectedProduct.has_addons,
          allow_same_day_scheduling: selectedProduct.allow_same_day_scheduling,
          image_url: selectedProduct.image_url
        })
      };
      
      console.log('💾 Dados sendo enviados para salvar:', productData);
      
      if (isEditModalOpen && selectedProduct) {
        console.log('✏️ Atualizando produto:', selectedProduct.id);
        await updateProduct(selectedProduct.id, productData);
      } else {
        console.log('🆕 Criando novo produto');
        await addProduct(productData as Omit<Product, 'id' | 'created_at'>);
      }
      
      await refetch();
      handleCloseModals();
      console.log('✅ Produto salvo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  }, [formData, selectedStoreId, isEditModalOpen, selectedProduct, updateProduct, addProduct, refetch, handleCloseModals]);
  
  // Handler para deletar produto
  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(productId);
        await refetch();
      } catch (error) {
        console.error('Erro ao deletar produto:', error);
        alert('Erro ao deletar produto. Tente novamente.');
      }
    }
  }, [deleteProduct, refetch]);
  
  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && product.is_active) ||
                         (filterStatus === 'inactive' && !product.is_active) ||
                         (filterStatus === 'available' && product.is_available) ||
                         (filterStatus === 'unavailable' && !product.is_available);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Obter nome da categoria
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };
  
  // Loading states
  if (storesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando lojas...</div>
      </div>
    );
  }
  
  if (!selectedStore) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Nenhuma loja encontrada.</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Seletor de Loja */}
      {stores.length > 1 && (
        <StoreSelector
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
        />
      )}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
            Gerenciar Produtos
          </h1>
          <p className="text-lg text-gray-600">
            Gerencie todos os produtos da sua loja de forma eficiente
          </p>
        </div>
        
        <Button 
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>
      
      {/* Informações da Loja */}
      <Card className="bg-gradient-to-r from-white to-blue-50 border border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedStore.name}</h3>
              <p className="text-gray-600">{selectedStore.address}</p>
            </div>
            <div className="ml-auto">
              <Badge variant="secondary" className="text-sm">
                {products.length} produtos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg">Carregando produtos...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg text-red-500">Erro: {error}</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-4">
              <Package className="h-12 w-12 text-gray-400" />
              <div className="text-lg text-gray-500">Nenhum produto encontrado</div>
              <Button onClick={handleAddProduct} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro produto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Imagem do produto */}
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Informações do produto */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-600">
                              R$ {product.price.toFixed(2)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(product.category_id)}
                          </Badge>
                        </div>
                        
                        {/* Status badges */}
                        <div className="flex gap-2 flex-wrap">
                          {product.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              Destaque
                            </Badge>
                          )}
                          <Badge 
                            variant={product.is_active ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {product.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge 
                            variant={product.is_available ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {product.is_available ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </div>
                        
                        {/* Estoque */}
                        {product.daily_stock && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              Estoque: {product.current_stock || 0}/{product.daily_stock}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewProduct(product)}
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
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Adicionar Produto */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Produto
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do novo produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do produto"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite a descrição do produto"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Estoque */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Controle de Estoque</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_stock">Estoque Diário</Label>
                  <Input
                    id="daily_stock"
                    type="number"
                    min="0"
                    value={formData.daily_stock || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      daily_stock: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Estoque Atual</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      current_stock: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Quantidade disponível"
                    disabled={!formData.daily_stock}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto em Destaque</Label>
                    <p className="text-sm text-gray-500">Destacar este produto na loja</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto Ativo</Label>
                    <p className="text-sm text-gray-500">Produto ativo no sistema</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto Disponível</Label>
                    <p className="text-sm text-gray-500">Disponível para venda</p>
                  </div>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleCloseModals} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Salvar Produto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Editar Produto */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Produto
            </DialogTitle>
            <DialogDescription>
              Edite as informações do produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Produto *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do produto"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite a descrição do produto"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço (R$) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Estoque */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Controle de Estoque</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-daily_stock">Estoque Diário</Label>
                  <Input
                    id="edit-daily_stock"
                    type="number"
                    min="0"
                    value={formData.daily_stock || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      daily_stock: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-current_stock">Estoque Atual</Label>
                  <Input
                    id="edit-current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      current_stock: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Quantidade disponível"
                    disabled={!formData.daily_stock}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto em Destaque</Label>
                    <p className="text-sm text-gray-500">Destacar este produto na loja</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto Ativo</Label>
                    <p className="text-sm text-gray-500">Produto ativo no sistema</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Produto Disponível</Label>
                    <p className="text-sm text-gray-500">Disponível para venda</p>
                  </div>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleCloseModals} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Visualizar Produto */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizar Produto
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Imagem do produto */}
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto" />
                    <p className="text-gray-500">Nenhuma imagem</p>
                  </div>
                )}
              </div>
              
              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Preço</Label>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        R$ {selectedProduct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Categoria</Label>
                    <Badge variant="outline" className="text-sm">
                      <Tag className="h-4 w-4 mr-1" />
                      {getCategoryName(selectedProduct.category_id)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Status */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.is_featured && (
                    <Badge variant="secondary">
                      Produto em Destaque
                    </Badge>
                  )}
                  <Badge variant={selectedProduct.is_active ? "default" : "destructive"}>
                    {selectedProduct.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge 
                    variant={product.is_available ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {product.is_available ? 'Disponível' : 'Indisponível'}
                  </Badge>
                </div>
              </div>
              
              {/* Estoque */}
              {selectedProduct.daily_stock && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Controle de Estoque</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Estoque Diário</Label>
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-500" />
                          <span className="text-lg font-semibold">{selectedProduct.daily_stock}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Estoque Atual</Label>
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-500" />
                          <span className="text-lg font-semibold">
                            {selectedProduct.current_stock || 0}
                          </span>
                          {selectedProduct.current_stock === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Sem estoque
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Ingredientes e Alérgenos */}
              {(selectedProduct.ingredients?.length > 0 || selectedProduct.allergens?.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {selectedProduct.ingredients?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Ingredientes</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.ingredients.map((ingredient, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedProduct.allergens?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Alérgenos</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.allergens.map((allergen, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleCloseModals} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
            <Button 
              onClick={() => {
                handleCloseModals();
                if (selectedProduct) {
                  handleEditProduct(selectedProduct);
                }
              }} 
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Produto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
