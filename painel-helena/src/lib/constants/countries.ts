export const COUNTRIES = [
  { value: 'BR', label: 'Brasil', code: 'BR', ddi: '+55' },
  { value: 'AR', label: 'Argentina', code: 'AR', ddi: '+54' },
  { value: 'CL', label: 'Chile', code: 'CL', ddi: '+56' },
  { value: 'CO', label: 'Colômbia', code: 'CO', ddi: '+57' },
  { value: 'MX', label: 'México', code: 'MX', ddi: '+52' },
  { value: 'PE', label: 'Peru', code: 'PE', ddi: '+51' },
  { value: 'UY', label: 'Uruguai', code: 'UY', ddi: '+598' },
  { value: 'PY', label: 'Paraguai', code: 'PY', ddi: '+595' },
  { value: 'BO', label: 'Bolívia', code: 'BO', ddi: '+591' },
  { value: 'EC', label: 'Equador', code: 'EC', ddi: '+593' },
  { value: 'VE', label: 'Venezuela', code: 'VE', ddi: '+58' },
  { value: 'US', label: 'Estados Unidos', code: 'US', ddi: '+1' },
  { value: 'CA', label: 'Canadá', code: 'CA', ddi: '+1' },
  { value: 'PT', label: 'Portugal', code: 'PT', ddi: '+351' },
  { value: 'ES', label: 'Espanha', code: 'ES', ddi: '+34' },
  { value: 'FR', label: 'França', code: 'FR', ddi: '+33' },
  { value: 'DE', label: 'Alemanha', code: 'DE', ddi: '+49' },
  { value: 'IT', label: 'Itália', code: 'IT', ddi: '+39' },
  { value: 'GB', label: 'Reino Unido', code: 'GB', ddi: '+44' },
  { value: 'JP', label: 'Japão', code: 'JP', ddi: '+81' },
];

export const BRAZIL_STATES = [
  { value: 'AC', label: 'AC' },
  { value: 'AL', label: 'AL' },
  { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' },
  { value: 'BA', label: 'BA' },
  { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' },
  { value: 'ES', label: 'ES' },
  { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' },
  { value: 'MT', label: 'MT' },
  { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' },
  { value: 'PA', label: 'PA' },
  { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' },
  { value: 'PE', label: 'PE' },
  { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' },
  { value: 'RN', label: 'RN' },
  { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' },
  { value: 'RR', label: 'RR' },
  { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' },
  { value: 'SE', label: 'SE' },
  { value: 'TO', label: 'TO' },
];

export const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
