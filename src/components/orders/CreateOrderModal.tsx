
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { createSimpleOrder, calculateOrderTotal } from '@/utils/orderService';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  storeId: string;
}

interface AddonItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
  addon_category_id: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  addons: AddonItem[];
  notes?: string;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  storeId
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, storeId]);

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      // Map products to ensure proper typing
      const mappedProducts: Product[] = (productsData || []).map(product => ({
        ...product,
        name: product.name || '',
        price: product.price || 0,
        store_id: product.store_id || storeId,
        category_id: product.category_id || '',
        is_featured: product.is_featured || false,
        is_available: product.is_available || true,
        is_active: product.is_active || true,
        created_at: product.created_at || new Date().toISOString(),
        images: product.image_url ? [{
          url: product.image_url,
          is_primary: true,
          order: 0
        }] : []
      }));

      setProducts(mappedProducts);

      // Fetch addons from addon_items
      const { data: addonsData } = await supabase
        .from('addon_items')
        .select('*')
        .eq('is_active', true);

      setAddons(addonsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addProductToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, addons: [] }];
      }
    });
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Calculate total using the unified service
  const calculateTotal = () => {
    const cartItems = orderItems.map(item => ({
      product: item.product,
      quantity: item.quantity,
      addons: item.addons.map(addon => ({
        ...addon,
        quantity: 1 // CreateOrderModal doesn't track addon quantities
      })),
      notes: item.notes
    }));
    
    const totals = calculateOrderTotal(cartItems, 0); // No delivery fee in admin modal
    return totals.total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || orderItems.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha os dados do cliente e adicione produtos ao pedido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Use the unified order service
      await createSimpleOrder({
        customerName,
        customerPhone,
        items: orderItems,
        deliveryType,
        paymentMethod,
        storeId,
        notes
      });

      toast({
        title: "Sucesso!",
        description: "Pedido criado com sucesso"
      });

      onOrderCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOrderItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryType('delivery');
    setPaymentMethod('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Produtos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {products.map(product => (
                <div key={product.id} className="border rounded-lg p-3">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addProductToOrder(product)}
                    className="mt-2 w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Itens do Pedido</h3>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        R$ {item.product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateItemQuantity(item.product.id, 0)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryType">Tipo de Entrega</Label>
              <Select value={deliveryType} onValueChange={(value: 'delivery' | 'pickup') => setDeliveryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Entrega</SelectItem>
                  <SelectItem value="pickup">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do pedido"
            />
          </div>

          {/* Total */}
          {orderItems.length > 0 && (
            <div className="text-right">
              <div className="text-xl font-bold">
                Total: R$ {calculateTotal().toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (!customerName || !customerPhone) || orderItems.length === 0}>
              {loading ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderModal;
