
import React from 'react';
import { Order } from '@/types';

interface PrintDAVProps {
  order: Order;
  storeName: string;
  storeAddress?: string;
}

const PrintDAV: React.FC<PrintDAVProps> = ({ order, storeName, storeAddress }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('dav-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DAV - ${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f0f0f0; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Documento Auxiliar de Venda</h2>
        <button
          onClick={handlePrint}
          className="no-print bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Imprimir DAV
        </button>
      </div>

      <div id="dav-content" className="bg-white p-6 border">
        {/* Cabeçalho */}
        <div className="header">
          <h1 className="text-xl font-bold">{storeName}</h1>
          {storeAddress && <p className="text-sm">{storeAddress}</p>}
          <p className="text-sm mt-2">DOCUMENTO AUXILIAR DE VENDA - DAV</p>
          <p className="text-xs">Este documento não tem valor fiscal</p>
        </div>

        {/* Informações do Pedido */}
        <div className="section">
          <div className="section-title">DADOS DO PEDIDO</div>
          <table>
            <tbody>
              <tr>
                <td><strong>Número do Pedido:</strong></td>
                <td>#{order.id.slice(0, 8)}</td>
              </tr>
              <tr>
                <td><strong>Data/Hora:</strong></td>
                <td>{new Date(order.created_at).toLocaleString('pt-BR')}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong></td>
                <td>{order.status.toUpperCase()}</td>
              </tr>
              <tr>
                <td><strong>Tipo:</strong></td>
                <td>{order.delivery_type === 'delivery' ? 'DELIVERY' : 'RETIRADA'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dados do Cliente */}
        <div className="section">
          <div className="section-title">DADOS DO CLIENTE</div>
          <table>
            <tbody>
              <tr>
                <td><strong>Nome:</strong></td>
                <td>{order.customer_name}</td>
              </tr>
              <tr>
                <td><strong>Telefone:</strong></td>
                <td>{order.customer_phone}</td>
              </tr>
              {order.customer_email && (
                <tr>
                  <td><strong>Email:</strong></td>
                  <td>{order.customer_email}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Endereço de Entrega */}
        {order.delivery_type === 'delivery' && (order.address || order.street) && (
          <div className="section">
            <div className="section-title">ENDEREÇO DE ENTREGA</div>
            <table>
              <tbody>
                <tr>
                  <td><strong>Endereço:</strong></td>
                  <td>{order.street || order.address}, {order.number}</td>
                </tr>
                {order.neighborhood && (
                  <tr>
                    <td><strong>Bairro:</strong></td>
                    <td>{order.neighborhood}</td>
                  </tr>
                )}
                {order.complement && (
                  <tr>
                    <td><strong>Complemento:</strong></td>
                    <td>{order.complement}</td>
                  </tr>
                )}
                {order.reference_point && (
                  <tr>
                    <td><strong>Ponto de Referência:</strong></td>
                    <td>{order.reference_point}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Itens do Pedido */}
        <div className="section">
          <div className="section-title">ITENS DO PEDIDO</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Aqui deveriam estar os itens reais do pedido */}
              <tr>
                <td colSpan={4} className="text-center text-gray-500">
                  Itens do pedido serão listados aqui quando a integração estiver completa
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="section">
          <div className="section-title">VALORES</div>
          <table>
            <tbody>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td>R$ {order.subtotal.toFixed(2)}</td>
              </tr>
              {order.delivery_fee && order.delivery_fee > 0 && (
                <tr>
                  <td><strong>Taxa de Entrega:</strong></td>
                  <td>R$ {order.delivery_fee.toFixed(2)}</td>
                </tr>
              )}
              <tr className="total">
                <td><strong>TOTAL GERAL:</strong></td>
                <td><strong>R$ {order.total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Forma de Pagamento */}
        <div className="section">
          <div className="section-title">FORMA DE PAGAMENTO</div>
          <p>{order.payment_method.toUpperCase()}</p>
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="section">
            <div className="section-title">OBSERVAÇÕES</div>
            <p>{order.notes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="section mt-8 text-center text-xs">
          <p>Este documento foi gerado automaticamente pelo sistema</p>
          <p>Data de impressão: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintDAV;
