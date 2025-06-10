
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, User, MapPin, Package, ShoppingBag } from 'lucide-react';
import { Order } from '@/types';
import PrintDAV from '@/components/reports/PrintDAV';
import { useOrderItems } from '@/hooks/useOrderItems';

interface OrderViewModalProps {
  order: Order | null;
  onClose: () => void;
  storeName?: string;
  storeAddress?: string;
}

const OrderViewModal: React.FC<OrderViewModalProps> = ({
  order,
  onClose,
  storeName = "Sua Loja",
  storeAddress
}) => {
  const [showPrintDAV, setShowPrintDAV] = React.useState(false);
  const { orderItems, loading: itemsLoading } = useOrderItems(order?.id);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (showPrintDAV) {
    return (
      <Dialog open={true} onOpenChange={() => setShowPrintDAV(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PrintDAV 
            order={order} 
            storeName={storeName}
            storeAddress={storeAddress}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pedido #{order.id.slice(0, 8)}</span>
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do pedido realizado em {new Date(order.created_at).toLocaleString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações do Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Nome:</span>
                <span className="ml-2">{order.customer_name}</span>
              </div>
              <div>
                <span className="font-medium">Telefone:</span>
                <span className="ml-2">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{order.customer_email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Itens do Pedido</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : orderItems && orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{item.products?.name || 'Produto não encontrado'}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>Quantidade: {item.quantity}</span>
                            <span className="mx-2">•</span>
                            <span>Preço unitário: R$ {((item.price || 0) / item.quantity).toFixed(2)}</span>
                          </div>
                          
                          {/* Adicionais do item */}
                          {item.order_item_addons && item.order_item_addons.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Adicionais:</p>
                              <div className="ml-4">
                                {item.order_item_addons.map((addon, addonIndex) => (
                                  <div key={addonIndex} className="text-sm text-gray-600">
                                    • {addon.addon_items?.name || 'Adicional'} - R$ {(addon.price || 0).toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.notes && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Observações:</p>
                              <p className="text-sm text-gray-600">{item.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg">R$ {(item.price || 0).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Total do item</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item encontrado para este pedido</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Endereço de Entrega */}
          {order.delivery_type === 'delivery' && (order.address || order.street) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Endereço de Entrega</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Endereço:</span>
                  <span className="ml-2">{order.street || order.address}</span>
                  {order.number && <span>, {order.number}</span>}
                </div>
                {order.neighborhood && (
                  <div>
                    <span className="font-medium">Bairro:</span>
                    <span className="ml-2">{order.neighborhood}</span>
                  </div>
                )}
                {order.city && (
                  <div>
                    <span className="font-medium">Cidade:</span>
                    <span className="ml-2">{order.city}</span>
                  </div>
                )}
                {order.state && (
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2">{order.state}</span>
                  </div>
                )}
                {order.zip_code && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="ml-2">{order.zip_code}</span>
                  </div>
                )}
                {order.complement && (
                  <div>
                    <span className="font-medium">Complemento:</span>
                    <span className="ml-2">{order.complement}</span>
                  </div>
                )}
                {order.reference_point && (
                  <div>
                    <span className="font-medium">Ponto de Referência:</span>
                    <span className="ml-2">{order.reference_point}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detalhes do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Detalhes do Pedido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Tipo:</span>
                  <span className="ml-2">
                    {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Pagamento:</span>
                  <span className="ml-2 capitalize">{order.payment_method}</span>
                </div>
                <div>
                  <span className="font-medium">Data:</span>
                  <span className="ml-2">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                {order.mercado_pago_payment_id && (
                  <div>
                    <span className="font-medium">ID Pagamento:</span>
                    <span className="ml-2 text-sm font-mono">{order.mercado_pago_payment_id}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                
                {order.delivery_fee && order.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>R$ {order.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Observações */}
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">Observações:</span>
                    <p className="mt-1 text-gray-600">{order.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => setShowPrintDAV(true)}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir DAV</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderViewModal;
