import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data/hora atual no timezone do Brasil (UTC-3)
 */
export const getNowInBrazil = (): Date => {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
};

/**
 * Formata uma data no timezone do Brasil
 * @param date - Data a ser formatada
 * @param formatStr - String de formato (compatível com date-fns)
 */
export const formatInBrazil = (date: Date, formatStr: string): string => {
  return formatInTimeZone(date, BRAZIL_TIMEZONE, formatStr);
};

/**
 * Converte uma data para o timezone do Brasil
 * @param date - Data a ser convertida
 */
export const toBrazilTimezone = (date: Date): Date => {
  return toZonedTime(date, BRAZIL_TIMEZONE);
};

/**
 * Interpreta uma data vinda do banco externo PostgreSQL.
 * O banco armazena timestamps sem timezone como horário de São Paulo,
 * mas a edge function converte para ISO string com "Z" (UTC).
 * Esta função corrige essa interpretação incorreta.
 * 
 * @param dateString - String ISO vinda do banco (ex: "2025-11-28T01:40:00.000Z")
 * @returns Date object representando o horário correto de São Paulo
 */
export const parseExternalDbDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // Remove o "Z" do final e milissegundos para interpretar como hora local de São Paulo
  const cleanDateString = dateString.replace(/Z$/, '').replace(/\.\d{3}$/, '');
  
  // Parse a data sem timezone - será interpretada como hora local
  const date = new Date(cleanDateString);
  
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Formata uma data vinda do banco externo para exibição.
 * Usa parseExternalDbDate para interpretar corretamente e depois formata.
 * 
 * @param dateString - String ISO vinda do banco
 * @param formatStr - String de formato (compatível com date-fns)
 */
export const formatExternalDbDate = (dateString: string | null | undefined, formatStr: string): string => {
  const date = parseExternalDbDate(dateString);
  if (!date) return "-";
  
  // Usa format simples do date-fns pois a data já está correta
  return format(date, formatStr);
};
