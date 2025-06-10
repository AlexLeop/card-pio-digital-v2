import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, TrendingUp, RotateCcw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isValidUUID } from '@/lib/utils';

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'sale' | 'reset' | 'adjustment';
  quantity_before: number;
  quantity_after: number;
  quantity_changed: number;
  reason?: string;
  created_at: string;
  order_id?: string;
}

interface StockMovementHistoryProps {
  storeId: string;
}

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({ storeId }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      // Validar UUID do storeId
      if (!isValidUUID(storeId)) {
        console.warn('StoreId inválido para movimentações:', storeId);
        setMovements([]);
        return;
      }
  
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
  
      // Verificar se a tabela stock_movements existe
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(name, store_id)
        `)
        .eq('products.store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
  
      if (filterType !== 'all') {
        query = query.eq('movement_type', filterType);
      }
  
      const { data, error } = await query;
  
      if (error) {
        // Se a tabela não existir
        if (error.code === '42P01') {
          console.warn('Tabela stock_movements não existe. Funcionalidade desabilitada.');
          setMovements([]);
          return;
        }
        throw error;
      }
  
      const formattedMovements = data?.map(movement => ({
        ...movement,
        product_name: movement.products.name
      })) || [];
  
      setMovements(formattedMovements);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [storeId, filterType, dateRange]);

  const filteredMovements = movements.filter(movement =>
    movement.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'reset':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'adjustment':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <TrendingDown className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge variant="destructive">Venda</Badge>;
      case 'reset':
        return <Badge variant="secondary">Reset</Badge>;
      case 'adjustment':
        return <Badge variant="default">Ajuste</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Movimentação de Estoque</CardTitle>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sale">Vendas</SelectItem>
              <SelectItem value="reset">Resets</SelectItem>
              <SelectItem value="adjustment">Ajustes</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Hoje</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchMovements} variant="outline">
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              filteredMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getMovementIcon(movement.movement_type)}
                    <div>
                      <h3 className="font-medium">{movement.product_name}</h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {movement.reason && (
                        <p className="text-xs text-gray-500 mt-1">{movement.reason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {movement.quantity_before} → {movement.quantity_after}
                        </span>
                        <span className={`text-sm font-medium ${
                          movement.quantity_changed > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ({movement.quantity_changed > 0 ? '+' : ''}{movement.quantity_changed})
                        </span>
                      </div>
                    </div>
                    
                    {getMovementBadge(movement.movement_type)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockMovementHistory;