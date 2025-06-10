
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, orderId } = await req.json()
    
    if (!amount || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Amount and orderId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get store credentials
    let accessToken = null
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('mercado_pago_access_token')
      .eq('id', orderData.store_id)
      .single()

    if (!storeError && storeData?.mercado_pago_access_token) {
      accessToken = storeData.mercado_pago_access_token
    }

    // Fallback to environment variables
    if (!accessToken) {
      accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    }
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not found in store or environment variables')
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentData = {
      transaction_amount: numericAmount,
      description: `Pedido ${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: 'customer@example.com'
      },
      external_reference: orderId
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      console.error('Mercado Pago API error:', response.status, await response.text())
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create PIX payment',
          suggestion: 'Verifique as configurações do Mercado Pago e tente novamente.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const payment = await response.json()

    // Update order with payment ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ mercado_pago_payment_id: payment.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order with payment ID:', updateError)
    }

    const pixData = {
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      qrCodeText: payment.point_of_interaction?.transaction_data?.qr_code || '',
      paymentId: payment.id,
      status: payment.status
    }

    // Validate PIX data
    if (!pixData.qrCode && !pixData.qrCodeText) {
      console.error('PIX data not found in payment response')
      return new Response(
        JSON.stringify({ 
          error: 'PIX data not available',
          suggestion: 'O pagamento foi criado mas o QR Code não foi gerado. Verifique a configuração da conta no Mercado Pago.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(JSON.stringify(pixData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        suggestion: 'Tente novamente em alguns minutos. Se o problema persistir, verifique as configurações do Mercado Pago.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
