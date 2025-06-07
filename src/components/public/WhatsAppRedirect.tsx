
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Order, Store, OrderItem } from '@/types';

interface WhatsAppRedirectProps {
  order: Order;
  orderItems: OrderItem[];
  store: Store;
  autoRedirect?: boolean;
}

const WhatsAppRedirect: React.FC<WhatsAppRedirectProps> = ({
  order,
  orderItems,
  store,
  autoRedirect = false
}) => {
  const [countdown, setCountdown] = useState(5);

  const formatWhatsAppMessage = () => {
    const items = orderItems.map(item => 
      `• ${item.quantity}x ${item.products?.name} - R$ ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const address = order.delivery_type === 'delivery' && order.address 
      ? `\n📍 *Endereço:* ${order.address}${order.number ? `, ${order.number}` : ''}${order.neighborhood ? `\n${order.neighborhood}` : ''}${order.complement ? `\nComplemento: ${order.complement}` : ''}`
      : '';

    return encodeURIComponent(
      `🛒 *Novo Pedido #${order.id.slice(0, 8)}*\n\n` +
      `👤 *Cliente:* ${order.customer_name}\n` +
      `📱 *Telefone:* ${order.customer_phone}\n` +
      `🚚 *Tipo:* ${order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}${address}\n\n` +
      `📝 *Itens:*\n${items}\n\n` +
      `💰 *Subtotal:* R$ ${order.subtotal.toFixed(2)}\n` +
      `${order.delivery_fee ? `🚚 *Taxa de entrega:* R$ ${order.delivery_fee.toFixed(2)}\n` : ''}` +
      `💳 *Total:* R$ ${order.total.toFixed(2)}\n` +
      `💳 *Pagamento:* ${order.payment_method}\n\n` +
      `🕒 *Realizado em:* ${new Date(order.created_at).toLocaleString('pt-BR')}`
    );
  };

  const redirectToWhatsApp = () => {
    const message = formatWhatsAppMessage();
    const whatsappNumber = store.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    if (autoRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && countdown === 0) {
      redirectToWhatsApp();
    }
  }, [autoRedirect, countdown]);

  return (
    <div className="text-center space-y-4">
      {autoRedirect ? (
        <div>
          <p className="text-lg font-medium mb-2">
            Redirecionando para o WhatsApp da loja...
          </p>
          <p className="text-2xl font-bold text-green-600">
            {countdown}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Você será redirecionado automaticamente para enviar os detalhes do pedido via WhatsApp
          </p>
        </div>
      ) : (
        <div>
          <p className="text-lg font-medium mb-4">
            Envie os detalhes do seu pedido para a loja via WhatsApp
          </p>
        </div>
      )}
      
      <Button
        onClick={redirectToWhatsApp}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        {autoRedirect ? 'Enviar Agora' : 'Enviar via WhatsApp'}
      </Button>
    </div>
  );
};

export default WhatsAppRedirect;
