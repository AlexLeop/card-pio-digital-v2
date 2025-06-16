import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Copy, Check, QrCode, CreditCard as CreditCardIcon, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  document?: string; // Adicionar campo para CPF
}

interface MercadoPagoPaymentProps {
  amount: number;
  description: string;
  customerData: CustomerData;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  storeId: string;
  paymentMethod: 'credit_card' | 'pix';
  orderId?: string;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const MercadoPagoPayment: React.FC<MercadoPagoPaymentProps> = ({
  amount,
  description,
  customerData,
  onSuccess,
  onError,
  onCancel,
  storeId,
  paymentMethod,
  orderId
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pixCode, setPixCode] = useState<string>('');
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [cardFormReady, setCardFormReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMercadoPago();
  }, []);
  
  // useEffect para inicialização do cartão
  useEffect(() => {
  // Só inicializar se for pagamento com cartão, o mp estiver disponível e não estiver carregando PIX
  if (paymentMethod === 'credit_card' && mp && !loading) {
  // Usar um timeout para garantir que o DOM esteja pronto
  const timer = setTimeout(() => {
  createCardPayment(mp);
  }, 1000);
  
  return () => clearTimeout(timer);
  }
  }, [mp, paymentMethod]);
  
  const loadMercadoPago = async () => {
  try {
  // Get store's Mercado Pago public key
  const response = await fetch(`https://eimlszeysrpapuwtudij.supabase.co/rest/v1/stores?select=mercado_pago_public_key&id=eq.${storeId}`, {
  headers: {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWxzemV5c3JwYXB1d3R1ZGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjUzNjksImV4cCI6MjA2MzAwMTM2OX0.HrHl6vpSVD578UGKBE5WUJHno7cSYsMk8RfVagFdAo4',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWxzemV5c3JwYXB1d3R1ZGlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTM2OSwiZXhwIjoyMDYzMDAxMzY5fQ.DNyXpKnkMJJRsUYuOXpu0g5SX-NVbVoLkEtmKLoIufE'
  }
  });
  
  const storeData = await response.json();
  const publicKey = storeData[0]?.mercado_pago_public_key;
  
  if (!publicKey) {
  throw new Error('Mercado Pago não configurado para esta loja');
  }
  
  // Load Mercado Pago SDK
  if (!window.MercadoPago) {
  const script = document.createElement('script');
  script.src = 'https://sdk.mercadopago.com/js/v2';
  script.onload = () => initializeMercadoPago(publicKey);
  script.onerror = () => onError('Erro ao carregar SDK do Mercado Pago');
  document.head.appendChild(script);
  } else {
  initializeMercadoPago(publicKey);
  }
  } catch (error) {
  onError('Erro ao carregar sistema de pagamento');
  }
  };
  
  const initializeMercadoPago = (publicKey: string) => {
  try {
  const mercadopago = new window.MercadoPago(publicKey);
  setMp(mercadopago);
  
  if (paymentMethod === 'pix') {
  createPixPayment();
  }
  // Não inicializar o cartão aqui, será feito via useEffect
  } catch (error) {
  onError('Erro ao inicializar pagamento');
  }
  };
  
  const createPixPayment = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const paymentData = {
        amount: Number(amount),
        description: description,
        orderId: orderId,
        customerData: {
          email: customerData.email || `${customerData.phone.replace(/\D/g, '')}@temp.com`,
          document: customerData.document || '00000000000'
        },
        webhookUrl: 'https://eimlszeysrpapuwtudij.supabase.co/functions/v1/payment-webhook'
      };
      
      const response = await fetch('https://eimlszeysrpapuwtudij.supabase.co/functions/v1/create-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWxzemV5c3JwYXB1d3R1ZGlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTM2OSwiZXhwIjoyMDYzMDAxMzY5fQ.DNyXpKnkMJJRsUYuOXpu0g5SX-NVbVoLkEtmKLoIufE'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.qr_code && data.qr_code_base64) {
          setPixData({
            qrCode: data.qr_code,
            qrCodeBase64: data.qr_code_base64,
            paymentId: data.payment_id
          });
          
          // Iniciar polling do status do pagamento
          const interval = setInterval(() => {
            pollPaymentStatus(data.payment_id);
          }, 5000);
          
          setPollingInterval(interval);
          
          // Limpar o intervalo após 10 minutos
          setTimeout(() => {
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
          }, 10 * 60 * 1000);
          
          toast({
            title: "PIX gerado com sucesso!",
            description: "Escaneie o QR Code ou copie o código para pagar"
          });
        } else {
          setErrorMessage('Dados do PIX não recebidos da API');
          throw new Error('Dados do PIX não recebidos da API');
        }
      }
    } catch (error: any) {
      if (!errorMessage) {
        setErrorMessage(`Erro ao criar pagamento PIX: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // useEffect modificado
  useEffect(() => {
  // Só inicializar se for pagamento com cartão e o mp estiver disponível
  if (paymentMethod === 'credit_card' && mp) {
  // Primeiro, desative o loading para garantir que o container seja renderizado
  setLoading(false);
  
  // Adicionar um timeout para garantir que o DOM esteja pronto após o loading ser desativado
  const timer = setTimeout(() => {
  createCardPayment(mp);
  }, 1000);
  
  return () => clearTimeout(timer);
  }
  }, [mp, paymentMethod]);
  
  const createCardPayment = async (mercadopago: any) => {
  try {
  // Função para tentar encontrar o container com retentativas
  const findContainer = async (attempts = 0, maxAttempts = 5): Promise<HTMLElement | null> => {
  const container = document.getElementById('cardPaymentBrick');
  if (container) {
  return container;
  }
  
  if (attempts >= maxAttempts) {
  return null;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre tentativas
  return findContainer(attempts + 1, maxAttempts);
  };
  
  // Tentar encontrar o container com várias tentativas
  const cardFormContainer = await findContainer();
  
  if (!cardFormContainer) {
  setErrorMessage('Erro ao encontrar o container do formulário. Tente novamente.');
  return;
  }
  
  // Limpar o container
  cardFormContainer.innerHTML = '';
  
  // Inicializar Bricks
  const bricksBuilder = mercadopago.bricks();
  
  // Card Payment Brick settings
  const settings = {
  initialization: {
  amount: Number(amount),
  payer: {
  email: customerData.email || `${customerData.phone.replace(/\D/g, '')}@temp.com`,
  },
  },
  customization: {
  visual: {
  style: {
  theme: 'default',
  }
  },
  paymentMethods: {
  creditCard: 'all',
  debitCard: 'all',
  }
  },
  callbacks: {
  onReady: () => {
  setCardFormReady(true);
  },
  onSubmit: async (cardData: any) => {
  setProcessing(true);
  
  try {
  // Verificar se cardData existe e tem um token
  if (!cardData || !cardData.token) {
  throw new Error('Dados do cartão não foram gerados corretamente. Por favor, tente novamente.');
  }
  // No callback onSubmit
  const response = await fetch('https://eimlszeysrpapuwtudij.supabase.co/functions/v1/process-card-payment', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWxzemV5c3JwYXB1d3R1ZGlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTM2OSwiZXhwIjoyMDYzMDAxMzY5fQ.DNyXpKnkMJJRsUYuOXpu0g5SX-NVbVoLkEtmKLoIufE'
  },
  body: JSON.stringify({
  token: cardData.token,
  amount: Number(amount),
  description,
  orderId: orderId,
  payment_method_id: cardData.payment_method_id, // Movido para o nível principal
  payer: {
  email: customerData.email || `${customerData.phone.replace(/\D/g, '')}@temp.com`,
  identification: {
  type: 'CPF',
  number: '11111111111'
  }
  }
  })
  });
  
  const result = await response.json();
  
  if (result.status === 'approved') {
  onSuccess(result.paymentId);
  } else {
  // Melhorar a mensagem de erro para o usuário
  const errorMessage = result.statusDetail || result.error || 'Pagamento não aprovado';
  throw new Error(`Erro no pagamento: ${errorMessage}`);
  }
  } catch (error: any) {
  console.error('Card payment error:', error);
  // Exibir mensagem de erro mais detalhada para o usuário
  onError(`Erro no pagamento: ${error.message}`);
  } finally {
  setProcessing(false);
  }
  },
  onError: (error: any) => {
  console.error('Card form error:', error);
  onError('Erro no formulário de pagamento');
  setProcessing(false);
  },
  },
  };
  
  console.log('Creating cardPayment brick with settings:', settings);
  try {
  await bricksBuilder.create('cardPayment', 'cardPaymentBrick', settings);
  console.log('CardPayment brick created successfully');
  } catch (brickError) {
  console.error('Error creating brick:', brickError);
  setErrorMessage(`Erro ao criar brick: ${brickError.message || JSON.stringify(brickError)}`);
  }
  
  } catch (error: any) {
  console.error('Error creating card payment:', error);
  onError(`Erro ao criar formulário de pagamento: ${error.message || JSON.stringify(error)}`);
  }
  };
  
  const pollPaymentStatus = async (paymentId: string) => {
  try {
  const response = await fetch(`https://eimlszeysrpapuwtudij.supabase.co/functions/v1/check-payment-status`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWxzemV5c3JwYXB1d3R1ZGlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTM2OSwiZXhwIjoyMDYzMDAxMzY5fQ.DNyXpKnkMJJRsUYuOXpu0g5SX-NVbVoLkEtmKLoIufE'
  },
  body: JSON.stringify({ paymentId })
  });
  
  const result = await response.json();
  
  if (result.status === 'approved') {
  // Limpar o intervalo de polling
  if (pollingInterval) {
  clearInterval(pollingInterval);
  setPollingInterval(null);
  }
  onSuccess(paymentId);
  } else if (result.status === 'rejected' || result.status === 'cancelled') {
  // Limpar o intervalo de polling
  if (pollingInterval) {
  clearInterval(pollingInterval);
  setPollingInterval(null);
  }
  onError('Pagamento não foi aprovado');
  }
  } catch (error) {
  console.error('Error checking payment status:', error);
  }
  };
  
  const copyPixCode = async () => {
  try {
  // Verificar se a API está disponível
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
  await navigator.clipboard.writeText(pixCode);
  setCopied(true);
  toast({
  title: "Código PIX copiado!",
  description: "Cole no seu app de pagamentos"
  });
  setTimeout(() => setCopied(false), 2000);
  } else {
  // Fallback para Edge mais antigo
  copyToClipboardFallback(pixCode);
  }
  } catch (error) {
  console.error('Error copying to clipboard:', error);
  // Tentar fallback
  copyToClipboardFallback(pixCode);
  }
  };
  
  const copyToClipboardFallback = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
  const successful = document.execCommand('copy');
  if (successful) {
  setCopied(true);
  toast({
  title: "Código PIX copiado!",
  description: "Cole no seu app de pagamentos"
  });
  setTimeout(() => setCopied(false), 2000);
  } else {
  throw new Error('execCommand failed');
  }
  } catch (err) {
  toast({
  title: "Erro ao copiar",
  description: "Tente selecionar e copiar manualmente",
  variant: "destructive"
  });
  } finally {
  document.body.removeChild(textArea);
  }
  };
  
  // Limpar o intervalo quando o componente for desmontado
  useEffect(() => {
  return () => {
  if (pollingInterval) {
  clearInterval(pollingInterval);
  }
  };
  }, [pollingInterval]);
  
  if (loading) {
  return (
  <Dialog open={true} onOpenChange={onCancel}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {paymentMethod === 'pix' ? 'Gerando PIX...' : 'Carregando formulário...'}
        </DialogTitle>
        <DialogDescription>
          {paymentMethod === 'pix' ? 'Preparando seu PIX...' : 'Inicializando sistema de pagamento...'}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {paymentMethod === 'pix' ? 'Preparando seu PIX...' : 'Inicializando sistema de pagamento...'}
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  );
  }

  return (
  <Dialog open={true} onOpenChange={(open) => {
    if (!open) onCancel();
  }}>
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          {paymentMethod === 'pix' ? (
            <>
              <QrCode className="h-5 w-5 mr-2" />
              Pagamento PIX
            </>
          ) : (
            <>
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Pagamento com Cartão
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          {paymentMethod === 'pix' 
            ? 'Escaneie o QR Code ou copie o código PIX para pagar'
            : 'Preencha os dados do seu cartão de forma segura'
          }
        </DialogDescription>
      </DialogHeader>
  
      <div className="space-y-4">
        {/* Error Message */}
        {errorMessage && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4 px-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 text-sm">Erro no pagamento</h4>
                  <p className="text-xs text-red-700 mt-1 whitespace-pre-line">{errorMessage}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setErrorMessage('');
                      if (paymentMethod === 'pix') {
                        createPixPayment();
                      }
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === 'pix' && pixCode && (
          <>
            {/* QR Code */}
            {pixQrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img 
                    src={`data:image/png;base64,${pixQrCode}`} 
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* PIX Code */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Código PIX</h3>
                    <p className="text-sm text-gray-600">
                      Copie o código abaixo ou escaneie o QR Code
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-mono break-all text-center select-all">
                      {pixCode}
                    </p>
                  </div>

                  <Button
                    onClick={copyPixCode}
                    className="w-full"
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar código PIX
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">Aguardando confirmação do pagamento...</p>
              <p className="mt-1">O pagamento será confirmado automaticamente em alguns segundos.</p>
            </div>
          </>
        )}

        {/* Card Payment Form */}
        {paymentMethod === 'credit_card' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="font-semibold text-sm">Preencha os dados do cartão</h3>
              <p className="text-xs text-gray-600">
                Seus dados são seguros e criptografados
              </p>
            </div>
            
            {/* Container para o formulário de cartão com altura máxima e scroll */}
            <div id="cardPaymentBrick" className="max-h-[350px] w-full border border-gray-200 rounded-md overflow-y-auto"></div>
            
            {processing && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Processando pagamento...</span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 px-3">
            <div className="flex justify-between items-center text-base font-semibold">
              <span>Total a pagar:</span>
              <span className="text-green-600">R$ {amount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions - Botão de cancelar sempre visível */}
        <div className="sticky bottom-0 pt-2 bg-background">
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  );
};

export default MercadoPagoPayment;
