import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { JuliaPerformanceRecord } from '@/hooks/useJuliaPerformance';
import { formatInBrazil, getNowInBrazil, formatExternalDbDate } from '@/lib/utils/timezone';

interface ExportFilters {
  dataInicio: string;
  dataFim: string;
  tipoAgente: string;
  statusContrato: string;
  agentId: string | null;
}

// Exportar PDF - apenas colunas visíveis
export const exportToPDF = (data: JuliaPerformanceRecord[], filtros: ExportFilters) => {
  const doc = new jsPDF('landscape');
  
  // Título
  doc.setFontSize(16);
  doc.text('Relatório de Desempenho - Julia', 14, 15);
  
  // Filtros aplicados
  doc.setFontSize(10);
  let yPos = 25;
  doc.text(`Período: ${filtros.dataInicio} a ${filtros.dataFim}`, 14, yPos);
  yPos += 5;
  if (filtros.tipoAgente !== 'TODOS') {
    doc.text(`Tipo: ${filtros.tipoAgente}`, 14, yPos);
    yPos += 5;
  }
  if (filtros.statusContrato !== 'TODOS') {
    doc.text(`Status: ${filtros.statusContrato}`, 14, yPos);
    yPos += 5;
  }
  doc.text(`Total de registros: ${data.length}`, 14, yPos);
  
  // Preparar dados da tabela
  const tableData = data.map(record => [
    formatExternalDbDate(record.created_at || record.max_created_at, 'dd/MM/yy HH:mm'),
    record.cod_agent,
    `${record.name}\n${record.business_name}`,
    record.whatsapp,
    record.status_document === 'SIGNED' ? 'Assinado' : 
      record.status_document === 'CREATED' ? 'Em Curso' : '-',
    record.total_msg.toString()
  ]);
  
  // Gerar tabela
  autoTable(doc, {
    startY: yPos + 10,
    head: [['DATA', 'CÓDIGO', 'NOME/ESCRITÓRIO', 'WHATSAPP', 'CONTRATO', 'TOTAL MSG']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Salvar
  const filename = `julia-performance-${formatInBrazil(getNowInBrazil(), 'yyyy-MM-dd-HHmmss')}.pdf`;
  doc.save(filename);
};

// Exportar XLSX - todas as colunas
export const exportToXLSX = (data: JuliaPerformanceRecord[], filtros: ExportFilters) => {
  // Preparar dados com todas as colunas
  const exportData = data.map(record => ({
    'Data': formatExternalDbDate(record.created_at || record.max_created_at, 'dd/MM/yyyy HH:mm:ss'),
    'Código Agente': record.cod_agent,
    'ID Agente': record.agent_id,
    'Nome': record.name,
    'Escritório': record.business_name,
    'ID Cliente': record.client_id,
    'Perfil Agente': record.perfil_agent,
    'Session ID': record.session_id,
    'WhatsApp': record.whatsapp,
    'Status Documento': record.status_document,
    'Total Mensagens': record.total_msg,
    'Data Criação': formatExternalDbDate(record.created_at, 'dd/MM/yyyy HH:mm:ss'),
    'Última Atualização': formatExternalDbDate(record.max_created_at, 'dd/MM/yyyy HH:mm:ss'),
  }));
  
  // Criar workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Desempenho Julia');
  
  // Adicionar filtros como segunda aba
  const filtrosData = [
    ['Filtro', 'Valor'],
    ['Data Início', filtros.dataInicio],
    ['Data Fim', filtros.dataFim],
    ['Tipo Agente', filtros.tipoAgente],
    ['Status Contrato', filtros.statusContrato],
    ['Total Registros', data.length],
  ];
  const wsFilters = XLSX.utils.aoa_to_sheet(filtrosData);
  XLSX.utils.book_append_sheet(wb, wsFilters, 'Filtros Aplicados');
  
  // Salvar
  const filename = `julia-performance-${formatInBrazil(getNowInBrazil(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// Exportar CSV - todas as colunas
export const exportToCSV = (data: JuliaPerformanceRecord[], filtros: ExportFilters) => {
  // Preparar dados
  const exportData = data.map(record => ({
    'Data': formatExternalDbDate(record.created_at || record.max_created_at, 'dd/MM/yyyy HH:mm:ss'),
    'Código Agente': record.cod_agent,
    'ID Agente': record.agent_id,
    'Nome': record.name,
    'Escritório': record.business_name,
    'ID Cliente': record.client_id,
    'Perfil Agente': record.perfil_agent,
    'Session ID': record.session_id,
    'WhatsApp': record.whatsapp,
    'Status Documento': record.status_document,
    'Total Mensagens': record.total_msg,
    'Data Criação': formatExternalDbDate(record.created_at, 'dd/MM/yyyy HH:mm:ss'),
    'Última Atualização': formatExternalDbDate(record.max_created_at, 'dd/MM/yyyy HH:mm:ss'),
  }));
  
  // Criar worksheet e converter para CSV
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `julia-performance-${formatInBrazil(getNowInBrazil(), 'yyyy-MM-dd-HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
