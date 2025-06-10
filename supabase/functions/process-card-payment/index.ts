
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
    // Modificar esta parte do código para usar o payment_method_id enviado pelo frontend
    const { token, amount, description, orderId, payer, payment_method_id } = await req.json()

    if (!token || !amount || !orderId || !payer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Fetch Mercado Pago credentials
    let accessToken = null
    
    if (orderId) {
      // Get store_id from order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('store_id')
        .eq('id', orderId)
        .single()

      if (!orderError && orderData) {
        // Get store credentials
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('mercado_pago_access_token')
          .eq('id', orderData.store_id)
          .single()

        if (!storeError && storeData?.mercado_pago_access_token) {
          accessToken = storeData.mercado_pago_access_token
        }
      }
    }

    // Fallback to environment variables
    if (!accessToken) {
      accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    }
    
    if (!accessToken) {
      throw new Error('Mercado Pago access token not configured')
    }

    // Generate unique idempotency key
    const idempotencyKey = `card-${orderId}-${Date.now()}`

    // Create card payment following Mercado Pago documentation
    // Criar o objeto de pagamento usando o payment_method_id do frontend
    const paymentData = {
      transaction_amount: parseFloat(amount.toFixed(2)),
      token: token,
      description: description || `Pedido ${orderId}`,
      installments: 1,
      payment_method_id: payment_method_id, // Usar o valor enviado pelo frontend
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number.replace(/\D/g, '') // Remove any formatting
        }
      },
      external_reference: orderId
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    })

    const responseText = await response.text()

    // Melhorar o tratamento de erros para fornecer mensagens mais detalhadas
    if (!response.ok) {
      console.error('Mercado Pago API error:', response.status, responseText)
      
      let errorDetail = 'Erro no processamento do pagamento'
      
      try {
        const errorResponse = JSON.parse(responseText)
        if (errorResponse.error) {
          errorDetail = errorResponse.error
        } else if (errorResponse.message) {
          errorDetail = errorResponse.message
        } else if (errorResponse.cause && errorResponse.cause.length > 0) {
          errorDetail = errorResponse.cause[0].description || errorResponse.cause[0].code
        }
      } catch (e) {
        // Se não conseguir analisar o JSON, usa a resposta de texto bruto
        errorDetail = responseText
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Falha no pagamento', 
          statusDetail: errorDetail 
        }),
        { 
          status: 400, // Usar 400 em vez de 500 para erros de negócio
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const payment = JSON.parse(responseText)

    // Update order with payment ID
    if (orderId && payment.id) {
      await supabase
        .from('orders')
        .update({ 
          mercado_pago_payment_id: payment.id,
          status: payment.status === 'approved' ? 'confirmed' : 'pending'
        })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing card payment:', error);
    // Extrair informações de erro mais detalhadas, se disponíveis
    let errorMessage = error.message;
    let errorDetails = null;
    // Tentar extrair mais detalhes se for um erro da API do Mercado Pago
    if (error.message && error.message.includes('Payment failed:')) {
      try {
        // Extrair o corpo da resposta da mensagem de erro
        const responseBody = error.message.split(' - ')[1];
        const errorData = JSON.parse(responseBody);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
        console.error('Mercado Pago detailed error:', JSON.stringify(errorDetails, null, 2));
      } catch (e) {
        console.error('Failed to parse error details:', e);
      }
    }
    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
}
  return new Response(JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
