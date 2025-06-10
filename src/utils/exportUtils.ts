import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

export const exportToCSV = (data: ExportData) => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateStockReport = (products: any[]) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR });
  
  return {
    headers: [
      'Produto',
      'Estoque Atual',
      'Estoque Diário',
      'Status',
      'Última Atualização'
    ],
    rows: products.map(product => [
      product.name,
      product.current_stock || 0,
      product.daily_stock || 'N/A',
      product.current_stock === 0 ? 'Esgotado' : 
        product.current_stock <= (product.daily_stock * 0.2) ? 'Baixo' : 'Normal',
      format(new Date(product.updated_at || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    ]),
    filename: `relatorio-estoque_${timestamp}`
  };
};

export const generateSalesReport = (salesData: any[]) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR });
  
  return {
    headers: [
      'Produto',
      'Unidades Vendidas',
      'Receita Total',
      'Giro de Estoque (%)',
      'Estoque Atual',
      'Status'
    ],
    rows: salesData.map(item => [
      item.product_name,
      item.total_sold,
      `R$ ${item.total_revenue.toFixed(2)}`,
      `${item.stock_turnover.toFixed(1)}%`,
      item.current_stock,
      item.current_stock === 0 ? 'Esgotado' : 
        item.current_stock <= (item.daily_stock * 0.2) ? 'Baixo' : 'Normal'
    ]),
    filename: `relatorio-vendas_${timestamp}`
  };
};