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
    // Verificar se é uma notificação do Mercado Pago
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await req.json()
    
    // Verificar se é uma notificação de pagamento
    if (!data.action || !data.data || !data.data.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification data' }),
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

    // Buscar o pedido pelo ID do pagamento
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, store_id')
      .eq('mercado_pago_payment_id', data.data.id)
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

    // Buscar as credenciais da loja
    let accessToken = null
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('mercado_pago_access_token')
      .eq('id', orderData.store_id)
      .single()

    if (!storeError && storeData?.mercado_pago_access_token) {
      accessToken = storeData.mercado_pago_access_token
    }

    // Fallback para variáveis de ambiente
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

    // Verificar o status do pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.data.id}`, {
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

    // Atualizar o status do pedido se o pagamento foi aprovado
    if (payment.status === 'approved') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderData.id)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update order status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully'
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
