
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const SalesChart = () => {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (error) throw error;

      // Agrupar vendas por dia
      const salesByDay = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        });
        if (!salesByDay[date]) {
          salesByDay[date] = 0;
        }
        salesByDay[date] += Number(order.total);
      });

      const chartData = Object.entries(salesByDay).map(([date, total]) => ({
        date,
        vendas: total
      }));

      setSalesData(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
    }
  };

  const chartConfig = {
    vendas: {
      label: "Vendas",
      color: "#3B82F6",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']}
              />
              <Bar 
                dataKey="vendas" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
