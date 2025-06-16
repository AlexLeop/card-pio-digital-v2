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
    const { paymentId } = await req.json()
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
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
      .select('store_id, mercado_pago_payment_id')
      .eq('mercado_pago_payment_id', paymentId)
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

    // Check payment status with Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Mercado Pago API error:', response.status, await response.text())
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check payment status',
          suggestion: 'Verifique as configurações do Mercado Pago e tente novamente.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const payment = await response.json()

    // Update order status if payment is approved
    if (payment.status === 'approved') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('mercado_pago_payment_id', paymentId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ 
        status: payment.status,
        paymentId: payment.id
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

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