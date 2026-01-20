import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProposalItem {
  description: string;
  monthlyValue: number;
  oneTimeValue: number;
}

interface ProposalData {
  items: ProposalItem[];
  monthlyTotal: number;
  oneTimeTotal: number;
  firstMonthTotal: number;
  annualTotal: number;
  validityDays: number;
  customDiscount: number;
  isAnnual: boolean;
}

export function generateProposalPdf(data: ProposalData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text('Proposta Comercial', pageWidth / 2, 25, { align: 'center' });
  
  // Company info
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Atende Julia - Automação Inteligente de Atendimento', pageWidth / 2, 35, { align: 'center' });
  
  // Date and validity
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + data.validityDays);
  
  doc.setFontSize(9);
  doc.text(`Data: ${today.toLocaleDateString('pt-BR')}`, 14, 50);
  doc.text(`Válida até: ${validUntil.toLocaleDateString('pt-BR')}`, 14, 56);
  
  // Items table
  const tableData = data.items.map(item => [
    item.description,
    item.monthlyValue > 0 ? formatCurrency(item.monthlyValue) : '-',
    item.oneTimeValue > 0 ? formatCurrency(item.oneTimeValue) : '-',
  ]);
  
  autoTable(doc, {
    startY: 65,
    head: [['Item', 'Valor Mensal', 'Valor Único']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Discount info
  if (data.customDiscount > 0) {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Desconto aplicado: ${data.customDiscount}%`, 14, finalY);
  }
  
  // Totals box
  const boxY = finalY + (data.customDiscount > 0 ? 10 : 0);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - 90, boxY, 76, 50, 3, 3);
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  
  doc.text('Mensal recorrente:', pageWidth - 86, boxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.monthlyTotal), pageWidth - 18, boxY + 12, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.text('Implementação (único):', pageWidth - 86, boxY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.oneTimeTotal), pageWidth - 18, boxY + 22, { align: 'right' });
  
  doc.setDrawColor(200);
  doc.line(pageWidth - 86, boxY + 27, pageWidth - 18, boxY + 27);
  
  doc.setFontSize(11);
  doc.setTextColor(59, 130, 246);
  doc.text('1º mês (total):', pageWidth - 86, boxY + 37);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.firstMonthTotal), pageWidth - 18, boxY + 37, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Anual estimado: ${formatCurrency(data.annualTotal)}`, pageWidth - 86, boxY + 46);
  
  // Payment info
  const paymentY = boxY + 60;
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'bold');
  doc.text('Formas de Pagamento:', 14, paymentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('• PIX ou Boleto bancário', 14, paymentY + 8);
  doc.text('• Cartão de crédito (em até 12x)', 14, paymentY + 15);
  
  if (data.isAnnual) {
    doc.setTextColor(34, 197, 94);
    doc.text('• 10% de desconto no pagamento anual à vista', 14, paymentY + 22);
  }
  
  // Terms
  const termsY = paymentY + 35;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Termos e Condições:', 14, termsY);
  doc.setFontSize(8);
  doc.text('• Esta proposta tem validade de ' + data.validityDays + ' dias a partir da data de emissão.', 14, termsY + 6);
  doc.text('• Os valores de infraestrutura são estimativas e podem variar conforme o uso real.', 14, termsY + 11);
  doc.text('• A implementação será iniciada após a confirmação do pagamento.', 14, termsY + 16);
  doc.text('• Preços sujeitos a alteração sem aviso prévio após o vencimento desta proposta.', 14, termsY + 21);
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Atende Julia - Transformando atendimento em resultados', pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.atendejulia.com.br | contato@atendejulia.com.br', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Save
  const fileName = `proposta-atendejulia-${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
