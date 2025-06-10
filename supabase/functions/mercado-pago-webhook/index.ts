
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // Verificar se é uma notificação de pagamento (incluindo testes)
    if (body.type === 'payment') {
      const paymentId = body.data?.id || body.id

      if (!paymentId) {
        return new Response('No payment ID', { status: 400, headers: corsHeaders })
      }

      // Para notificações de teste, apenas retornar sucesso
      if (paymentId === '123456' || paymentId === 123456 || body.live_mode === false) {
        return new Response('Test webhook received successfully', { headers: corsHeaders })
      }

      // Buscar o pedido com este payment_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('mercado_pago_payment_id', paymentId.toString())
        .single()

      if (orderError) {
        console.error('Error finding order:', orderError)
        return new Response('Order not found', { status: 404, headers: corsHeaders })
      }

      // Buscar as credenciais da loja para fazer a verificação do pagamento
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('mercado_pago_access_token')
        .eq('id', order.store_id)
        .single()

      let accessToken = null
      if (!storeError && storeData) {
        accessToken = storeData.mercado_pago_access_token
      }

      // Fallback para o secret do Supabase
      if (!accessToken) {
        accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      }
      
      if (!accessToken) {
        console.error('MERCADO_PAGO_ACCESS_TOKEN not found in store or environment variables')
        return new Response('Payment gateway not configured', { status: 500, headers: corsHeaders })
      }

      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment from Mercado Pago:', paymentResponse.status)
        return new Response('Failed to verify payment', { status: 500, headers: corsHeaders })
      }

      const paymentData = await paymentResponse.json()

      let newStatus = order.status
      
      // Mapear status do Mercado Pago para status do pedido
      switch (paymentData.status) {
        case 'approved':
          newStatus = 'confirmed'
          break
        case 'pending':
          newStatus = 'pending'
          break
        case 'cancelled':
        case 'rejected':
          newStatus = 'cancelled'
          break
        default:
          // Status desconhecido, manter o atual
          break
      }

      if (newStatus !== order.status) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id)

        if (updateError) {
          console.error('Error updating order:', updateError)
          return new Response('Error updating order', { status: 500, headers: corsHeaders })
        }
      }
    }

    return new Response('OK', { headers: corsHeaders })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})
