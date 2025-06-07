
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem, Store } from '@/types';
import CheckoutModal from './CheckoutModal';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  store: Store;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  store,
  onClose
}) => {
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [showCheckout, setShowCheckout] = useState(false);

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const productPrice = item.product.sale_price || item.product.price;
      const addonsPrice = item.addons.reduce((sum, addon) => sum + addon.price, 0);
      return total + ((productPrice + addonsPrice) * item.quantity);
    }, 0);
  };

  const getDeliveryFee = () => {
    if (deliveryType === 'pickup') return 0;
    return store.delivery_fee || 0;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const canProceed = () => {
    if (cart.length === 0) return false;
    
    const subtotal = getSubtotal();
    const minimumOrder = store.minimum_order || 0;
    
    return subtotal >= minimumOrder;
  };

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Seu carrinho está vazio</p>
          <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrinho ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Itens do Carrinho */}
          <div className="space-y-3">
            {cart.map((item, index) => {
              const productPrice = item.product.sale_price || item.product.price;
              const addonsPrice = item.addons.reduce((sum, addon) => sum + addon.price, 0);
              const itemTotal = (productPrice + addonsPrice) * item.quantity;

              return (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      {item.addons.length > 0 && (
                        <div className="text-xs text-gray-600">
                          {item.addons.map(addon => addon.name).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-gray-500 italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-medium text-sm">
                      R$ {itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Tipo de Entrega */}
          <div className="space-y-3">
            <h4 className="font-medium">Tipo de Entrega</h4>
            <RadioGroup value={deliveryType} onValueChange={(value: 'delivery' | 'pickup') => setDeliveryType(value)}>
              {store.delivery_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1">
                    <div className="flex justify-between">
                      <span>Entrega</span>
                      <span>R$ {getDeliveryFee().toFixed(2)}</span>
                    </div>
                  </Label>
                </div>
              )}
              
              {store.pickup_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1">
                    <div className="flex justify-between">
                      <span>Retirada no local</span>
                      <span>Grátis</span>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <Separator />

          {/* Resumo */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {getSubtotal().toFixed(2)}</span>
            </div>
            
            {deliveryType === 'delivery' && getDeliveryFee() > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span>R$ {getDeliveryFee().toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>R$ {getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Pedido Mínimo */}
          {store.minimum_order && store.minimum_order > 0 && (
            <div className="text-xs text-gray-600">
              {getSubtotal() < store.minimum_order ? (
                <div className="text-red-600">
                  Pedido mínimo: R$ {store.minimum_order.toFixed(2)}
                  <br />
                  Faltam: R$ {(store.minimum_order - getSubtotal()).toFixed(2)}
                </div>
              ) : (
                <div className="text-green-600">
                  ✓ Pedido mínimo atingido
                </div>
              )}
            </div>
          )}

          {/* Botão de Finalizar */}
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={!canProceed()}
            className="w-full"
          >
            Finalizar Pedido
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Checkout */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          store={store}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            onCheckout();
          }}
        />
      )}
    </>
  );
};

export default Cart;
