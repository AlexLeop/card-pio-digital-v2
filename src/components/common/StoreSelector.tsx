import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';
import { Store } from 'lucide-react';

interface StoreSelectorProps {
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  className?: string;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ 
  selectedStoreId, 
  onStoreChange, 
  className = "" 
}) => {
  const { stores, loading } = useStores();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Store className="h-4 w-4" />
        <span className="text-sm">Carregando lojas...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Store className="h-4 w-4" />
      <Select value={selectedStoreId} onValueChange={onStoreChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione uma loja" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StoreSelector;