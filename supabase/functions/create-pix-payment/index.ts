
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE PIX PAYMENT FUNCTION START ===')
    
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const requestData = await req.json()
    console.log('Request data received:', requestData)

    const { amount, description, orderId, customerData } = requestData

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount)
      return new Response(
        JSON.stringify({ error: 'Valid amount is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!orderId || typeof orderId !== 'string') {
      console.error('Invalid orderId:', orderId)
      return new Response(
        JSON.stringify({ error: 'Valid orderId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing PIX payment - Amount:', amount, 'OrderId:', orderId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch Mercado Pago credentials
    let accessToken = null
    
    try {
      // Get store_id from order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('store_id')
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        throw new Error('Order not found')
      }

      // Get store credentials
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('mercado_pago_access_token, name')
        .eq('id', orderData.store_id)
        .single()

      if (!storeError && storeData?.mercado_pago_access_token) {
        accessToken = storeData.mercado_pago_access_token
        console.log('Store credentials found for store:', storeData.name)
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
    }

    // Fallback to environment variables
    if (!accessToken) {
      accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      console.log('Using fallback access token from environment')
    }
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate unique idempotency key
    const idempotencyKey = `pix-${orderId}-${Date.now()}`

    // Create PIX payment with all required fields according to Mercado Pago documentation
    const paymentData = {
      transaction_amount: parseFloat(amount.toFixed(2)),
      description: description || `Pedido ${orderId}`,
      payment_method_id: 'pix',
      external_reference: orderId,
      payer: {
        email: customerData?.email || 'cliente@exemplo.com'
        // Remover o campo identification completamente
      }
    }

    console.log('Creating PIX payment with data:', JSON.stringify(paymentData, null, 2))

    // Make request to Mercado Pago API v1/payments endpoint
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    })

    const responseText = await mpResponse.text()
    console.log('Mercado Pago response status:', mpResponse.status)
    console.log('Mercado Pago response body:', responseText)

    if (!mpResponse.ok) {
      console.error('Mercado Pago API error:', mpResponse.status, responseText)
      
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        if (errorJson.message) {
          errorDetails = errorJson.message
        } else if (errorJson.cause && errorJson.cause[0]) {
          errorDetails = errorJson.cause[0].description || errorJson.message || 'Unknown error'
        }
      } catch (e) {
        // Keep original error text if parsing fails
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Payment provider error: ${mpResponse.status}`,
          details: errorDetails,
          suggestion: 'Verifique se as credenciais do Mercado Pago estão corretas e válidas'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const payment = JSON.parse(responseText)
    console.log('PIX payment created successfully:', payment.id)

    // Update order with payment ID
    if (payment.id) {
      try {
        await supabase
          .from('orders')
          .update({ mercado_pago_payment_id: payment.id })
          .eq('id', orderId)
        console.log('Order updated with payment ID:', payment.id)
      } catch (updateError) {
        console.error('Error updating order:', updateError)
      }
    }

    // Extract PIX data
    const pixData = {
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      qrCodeText: payment.point_of_interaction?.transaction_data?.qr_code || '',
      paymentId: payment.id,
      status: payment.status
    }

    // Validate PIX data
    if (!pixData.qrCode && !pixData.qrCodeText) {
      console.error('PIX data not found in payment response')
      console.log('Full payment response:', JSON.stringify(payment, null, 2))
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

    console.log('PIX payment successful, returning data')

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
