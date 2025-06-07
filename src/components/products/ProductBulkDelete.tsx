
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types';

interface ProductBulkDeleteProps {
  products: Product[];
  onDeleteSuccess: () => void;
}

const ProductBulkDelete: React.FC<ProductBulkDeleteProps> = ({ products, onDeleteSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Produtos excluídos!",
        description: `${selectedProducts.length} produtos foram excluídos com sucesso.`
      });

      setIsOpen(false);
      setSelectedProducts([]);
      onDeleteSuccess();
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast({
        title: "Erro na exclusão",
        description: "Não foi possível excluir os produtos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Trash2 className="h-4 w-4" />
          <span>Exclusão em Massa</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exclusão em Massa de Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Os produtos selecionados serão permanentemente excluídos.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Checkbox
                id="select-all"
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Selecionar todos ({products.length} produtos)
              </label>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {products.map(product => (
                <div key={product.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => 
                      handleProductToggle(product.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">IMG</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          R$ {product.price.toFixed(2)}
                          {product.sale_price && ` (Promo: R$ ${product.sale_price.toFixed(2)})`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedProducts.length > 0 && (
              <p className="text-sm text-blue-600 font-medium">
                {selectedProducts.length} produto(s) selecionado(s) para exclusão
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={loading || selectedProducts.length === 0}
              variant="destructive"
            >
              {loading ? 'Excluindo...' : `Excluir ${selectedProducts.length} Produto(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBulkDelete;
