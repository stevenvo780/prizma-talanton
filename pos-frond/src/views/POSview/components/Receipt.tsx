import { Client } from '../../../utils/types';
import { fmtCOP } from '../../../utils/format';

// Sanitizar HTML para prevenir XSS en impresión de recibos
const sanitizeHtml = (value: string | undefined): string => {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

interface ReceiptData {
  client: Client;
  items: Array<{
    product: any;
    productQuantity: number;
    productSubtotal: number;
    totalTax: number;
    totalDiscount: number;
  }>;
  totals: { totalAmountBeforeTax: number; ivaAmount: number; withholdingTaxAmount: number; totalAmount: number };
  company?: { 
    name?: string; 
    nit?: string; 
    dv?: string;
    legalAddress?: string;
    taxRegime?: string;
  };
  date: string;
}

export default function Receipt(win: Window, data: ReceiptData): string {
  const { client, items, totals, company, date } = data;
  const header = `
    <h2>${sanitizeHtml(company?.name || 'Mi Negocio S.A.')}</h2>
    <p style="text-align:center;">
      NIT: ${sanitizeHtml(company?.nit || '999999999-9')}${company?.dv ? '-' + sanitizeHtml(company.dv) : ''}<br/>
      ${sanitizeHtml(company?.legalAddress || 'Dirección')}<br/>
      Régimen: ${sanitizeHtml(company?.taxRegime || 'General')}
    </p>
    <hr/>
    <p>Fecha: ${date}<br/>
       Cliente: ${sanitizeHtml(client.name)} ${sanitizeHtml(client.surname||'')} - ${sanitizeHtml(client.documentNumber||'')}
    </p>
  `;
  const rows = items.map(i => `
    <tr>
      <td>${sanitizeHtml(i.product.name)}</td>
      <td>${i.productQuantity}</td>
      <td>${fmtCOP(i.productSubtotal - i.totalTax + i.totalDiscount)}</td>
      <td>${fmtCOP(i.totalTax)}</td>
      <td>${fmtCOP(i.totalDiscount)}</td>
      <td>${fmtCOP(i.productSubtotal)}</td>
    </tr>
  `).join('');
  const table = `
    <table>
      <thead>
        <tr><th>Producto</th><th>Ud.</th><th>Base</th><th>Iva</th><th>Desc.</th><th>Subtotal</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  const footer = `
    <table class="totales">
      <tr><td>Subtotal:</td><td>${fmtCOP(totals.totalAmountBeforeTax)}</td></tr>
      <tr><td>Iva:</td><td>${fmtCOP(totals.ivaAmount)}</td></tr>
      <tr><td>Desc.:</td><td>-${fmtCOP(totals.withholdingTaxAmount)}</td></tr>
      <tr><td><strong>Total:</strong></td><td><strong>${fmtCOP(totals.totalAmount)}</strong></td></tr>
    </table>
    <p style="text-align:center;margin-top:20px;">¡Gracias por su compra!</p>
  `;
  return header + table + footer;
}
