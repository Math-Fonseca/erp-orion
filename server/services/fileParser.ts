import * as XLSX from 'xlsx';

interface SampleData {
  number: string;
  uasg: string;
  agency: string;
  sendDate?: Date;
  trackingCode?: string;
  returnDate?: Date;
  willBeDeducted?: boolean;
}

interface ProcessData {
  number: string;
  uasg: string;
  agency: string;
  contractType: string;
  contractDate?: Date;
  validityMonths?: number;
}

interface CatalogData {
  code: string;
  description: string;
  brand?: string;
}

export async function parseExcelFile(
  buffer: Buffer, 
  type: 'samples' | 'processes' | 'catalog'
): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    switch (type) {
      case 'samples':
        return parseSampleData(jsonData);
      case 'processes':
        return parseProcessData(jsonData);
      case 'catalog':
        return parseCatalogData(jsonData);
      default:
        throw new Error('Invalid file type');
    }
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

function parseSampleData(data: any[]): SampleData[] {
  return data.map((row: any) => ({
    number: String(row['Número'] || row['Number'] || row['numero'] || ''),
    uasg: String(row['UASG'] || row['uasg'] || ''),
    agency: String(row['Órgão'] || row['Agency'] || row['orgao'] || ''),
    sendDate: parseDate(row['Data Envio'] || row['Send Date'] || row['data_envio']),
    trackingCode: String(row['Rastreio'] || row['Tracking'] || row['rastreio'] || ''),
    returnDate: parseDate(row['Data Retorno'] || row['Return Date'] || row['data_retorno']),
    willBeDeducted: parseBoolean(row['Será Abatido'] || row['Will Be Deducted'] || row['sera_abatido']),
  })).filter(item => item.number && item.uasg && item.agency);
}

function parseProcessData(data: any[]): ProcessData[] {
  return data.map((row: any) => ({
    number: String(row['Número'] || row['Number'] || row['numero'] || ''),
    uasg: String(row['UASG'] || row['uasg'] || ''),
    agency: String(row['Órgão'] || row['Agency'] || row['orgao'] || ''),
    contractType: String(row['Tipo'] || row['Type'] || row['tipo'] || 'registro_precos'),
    contractDate: parseDate(row['Data Contrato'] || row['Contract Date'] || row['data_contrato']),
    validityMonths: parseInt(row['Vigência (meses)'] || row['Validity (months)'] || row['vigencia_meses'] || '12'),
  })).filter(item => item.number && item.uasg && item.agency);
}

function parseCatalogData(data: any[]): CatalogData[] {
  return data.map((row: any) => ({
    code: String(row['Código'] || row['Code'] || row['codigo'] || ''),
    description: String(row['Descrição'] || row['Description'] || row['descricao'] || ''),
    brand: String(row['Marca'] || row['Brand'] || row['marca'] || ''),
  })).filter(item => item.code && item.description);
}

function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  if (value instanceof Date) return value;
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  if (typeof value === 'number') {
    // Excel date serial number
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  return undefined;
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}
