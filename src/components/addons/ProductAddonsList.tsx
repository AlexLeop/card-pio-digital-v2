
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus } from 'lucide-react';
import { ProductAddon } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProductAddonsListProps {
  addons: ProductAddon[];
  onEdit: (addon: ProductAddon) => void;
  onRefresh: () => void;
}

const ProductAddonsList: React.FC<ProductAddonsListProps> = ({
  addons,
  onEdit,
  onRefresh
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (addonId: string) => {
    if (!confirm('Tem certeza que deseja excluir este adicional?')) return;

    setLoading(addonId);
    try {
      const { error } = await supabase
        .from('addon_items')
        .delete()
        .eq('id', addonId);

      if (error) throw error;

      toast({
        title: "Adicional excluído com sucesso!"
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir adicional",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleToggleAvailability = async (addonId: string, currentStatus: boolean) => {
    setLoading(addonId);
    try {
      const { error } = await supabase
        .from('addon_items')
        .update({ is_active: !currentStatus })
        .eq('id', addonId);

      if (error) throw error;

      toast({
        title: "Status atualizado com sucesso!"
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adicionais</h2>
        <Button onClick={() => onEdit({} as ProductAddon)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Adicional
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map((addon) => (
          <Card key={addon.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{addon.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(addon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(addon.id)}
                    disabled={loading === addon.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {addon.description && (
                <p className="text-sm text-gray-600">{addon.description}</p>
              )}

              <div className="flex justify-between items-center">
                <span className="font-medium">R$ {addon.price.toFixed(2)}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Disponível</span>
                  <Switch
                    checked={addon.is_available}
                    onCheckedChange={() => handleToggleAvailability(addon.id, addon.is_available)}
                  />
                </div>
              </div>

              {addon.max_quantity && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Máx: {addon.max_quantity}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {addons.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Nenhum adicional encontrado</p>
            <Button 
              onClick={() => onEdit({} as ProductAddon)} 
              className="mt-4"
            >
              Criar primeiro adicional
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductAddonsList;
