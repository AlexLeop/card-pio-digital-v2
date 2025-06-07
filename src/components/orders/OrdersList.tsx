
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, Eye, Edit, Receipt, Package, Calendar, DollarSign } from 'lucide-react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrdersListProps {
  orders: Order[];
  onAddOrder: () => void;
  onEditOrder: (order: Order) => void;
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrdersList = ({ orders, onAddOrder, onEditOrder, onViewOrder, onUpdateStatus }: OrdersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone.includes(searchTerm) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesDeliveryType = filterDeliveryType === 'all' || order.delivery_type === filterDeliveryType;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || order.payment_method === filterPaymentMethod;
    
    return matchesSearch && matchesStatus && matchesDeliveryType && matchesPaymentMethod;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDeliveryType('all');
    setFilterPaymentMethod('all');
    setCurrentPage(1);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    onUpdateStatus(orderId, newStatus);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-6 w-6" />
              <span>Gerenciar Pedidos</span>
              <Badge variant="secondary">{orders.length}</Badge>
            </CardTitle>
            <Button onClick={onAddOrder} className="gradient-bg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, telefone ou ID do pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDeliveryType} onValueChange={setFilterDeliveryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="pickup">Retirada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-mono text-sm">
                      #{order.id.substring(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Badge variant={order.delivery_type === 'delivery' ? 'default' : 'secondary'}>
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Retirada'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {order.payment_method.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      R$ {order.total.toFixed(2)}
                    </div>
                    {order.delivery_fee && order.delivery_fee > 0 && (
                      <div className="text-xs text-gray-500">
                        + R$ {order.delivery_fee.toFixed(2)} entrega
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={order.status} 
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                            {statusLabels[order.status as keyof typeof statusLabels]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="ready">Pronto</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditOrder(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado vazio */}
      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">
              {orders.length === 0 ? (
                <div>
                  <p className="text-lg mb-2">Nenhum pedido encontrado</p>
                  <p>Os pedidos aparecerão aqui quando forem criados</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Nenhum pedido encontrado</p>
                  <p>Tente ajustar os filtros de busca</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrdersList;
