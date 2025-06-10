
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { Store as StoreType } from '@/types';
import StoreCard from './StoreCard';
import StoreForm from './StoreForm';
import StoreViewModal from './StoreViewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StoresListProps {
  stores: StoreType[];
  onAddStore: (storeData: Omit<StoreType, 'id' | 'created_at'>) => Promise<any>;
  onEditStore: (store: StoreType) => void;
  onViewStore: (store: StoreType) => void;
}

const StoresList = ({ stores, onAddStore, onEditStore, onViewStore }: StoresListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && store.is_active) ||
                         (filterActive === 'inactive' && !store.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const handleSaveNewStore = async (storeData: Omit<StoreType, 'id' | 'created_at'>) => {
    try {
      await onAddStore(storeData);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar loja:", error);
    }
  };

  const handleViewStore = (store: StoreType) => {
    // Abrir cardápio da loja em nova aba
    window.open(`/loja/${store.slug}`, '_blank');
  };

  const handleEditStore = (store: StoreType) => {
    setSelectedStore(store);
    setIsEditModalOpen(true);
  };

  const handleSaveEditStore = async (storeData: Omit<StoreType, 'id' | 'created_at'>) => {
    if (selectedStore) {
      try {
        await onEditStore({ ...selectedStore, ...storeData });
        setIsEditModalOpen(false);
        setSelectedStore(null);
      } catch (error) {
        console.error("Erro ao editar loja:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Gerenciar Lojas</span>
              <Badge variant="secondary">{stores.length}</Badge>
            </CardTitle>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Loja
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Nova Loja</DialogTitle>
                </DialogHeader>
                <StoreForm onSave={handleSaveNewStore} onCancel={() => setIsAddModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar lojas..."
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
                Todas
              </Button>
              <Button
                variant={filterActive === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActive('active')}
              >
                Ativas
              </Button>
              <Button
                variant={filterActive === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActive('inactive')}
              >
                Inativas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredStores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              {stores.length === 0 ? (
                <div>
                  <p className="text-lg mb-2">Nenhuma loja cadastrada</p>
                  <p>Comece criando sua primeira loja</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Nenhuma loja encontrada</p>
                  <p>Tente ajustar os filtros de busca</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEditStore}
              onView={handleViewStore}
            />
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {isEditModalOpen && selectedStore && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Editar Loja</DialogTitle>
            </DialogHeader>
            <StoreForm 
              store={selectedStore} 
              onSave={handleSaveEditStore} 
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedStore(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StoresList;
