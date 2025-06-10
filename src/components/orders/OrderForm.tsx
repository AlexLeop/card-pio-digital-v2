
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AddressForm, { AddressData } from '@/components/common/AddressForm';

interface OrderFormProps {
  order: Order | null;
  storeId: string;
  onClose: () => void;
  onSave: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
  order,
  storeId,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_type: 'delivery' as 'delivery' | 'pickup',
    payment_method: 'cash',
    status: 'pending',
    subtotal: 0,
    delivery_fee: 0,
    total: 0,
    notes: '',
    reference_point: ''
  });

  const [addressData, setAddressData] = useState<AddressData>({
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && order.id) {
      setFormData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        customer_email: order.customer_email || '',
        delivery_type: order.delivery_type || 'delivery',
        payment_method: order.payment_method || 'cash',
        status: order.status || 'pending',
        subtotal: order.subtotal || 0,
        delivery_fee: order.delivery_fee || 0,
        total: order.total || 0,
        notes: order.notes || '',
        reference_point: order.reference_point || ''
      });

      setAddressData({
        zip_code: order.zip || '',
        street: order.street || '',
        number: order.number || '',
        complement: order.complement || '',
        neighborhood: order.neighborhood || '',
        city: order.city || '',
        state: order.state || ''
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        ...addressData,
        // Manter compatibilidade com campo address antigo
        address: formData.delivery_type === 'delivery' ? 
          `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ''} - ${addressData.neighborhood}` : 
          null,
        store_id: storeId,
        subtotal: Number(formData.subtotal),
        delivery_fee: Number(formData.delivery_fee),
        total: Number(formData.total)
      };

      if (order?.id) {
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', order.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([orderData]);

        if (error) throw error;
      }

      toast({
        title: order?.id ? "Pedido atualizado!" : "Pedido criado!"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular total automaticamente
  useEffect(() => {
    const newTotal = formData.subtotal + (formData.delivery_type === 'delivery' ? formData.delivery_fee : 0);
    if (newTotal !== formData.total) {
      setFormData(prev => ({ ...prev, total: newTotal }));
    }
  }, [formData.subtotal, formData.delivery_fee, formData.delivery_type]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order?.id ? 'Editar' : 'Novo'} Pedido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nome do Cliente *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefone *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_type">Tipo</Label>
                <Select 
                  value={formData.delivery_type} 
                  onValueChange={(value: 'delivery' | 'pickup') => setFormData({ ...formData, delivery_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Entrega</SelectItem>
                    <SelectItem value="pickup">Retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Endereço de Entrega */}
              {formData.delivery_type === 'delivery' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Endereço de Entrega</h4>
                  <AddressForm
                    value={addressData}
                    onChange={setAddressData}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="reference_point">Ponto de Referência</Label>
                    <Input
                      id="reference_point"
                      value={formData.reference_point}
                      onChange={(e) => setFormData({ ...formData, reference_point: e.target.value })}
                      placeholder="Ex: Próximo ao supermercado"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Valores e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal (R$)</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">
                    Taxa de Entrega (R$) {formData.delivery_type === 'pickup' && '(Desabilitado)'}
                  </Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.delivery_type === 'delivery' ? formData.delivery_fee : 0}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
                    disabled={formData.delivery_type === 'pickup'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">Total (R$)</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações do Pedido</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações especiais do pedido"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
