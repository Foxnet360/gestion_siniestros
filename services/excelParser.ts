import * as XLSX from 'xlsx';
import { addYears, parse, isValid } from 'date-fns';
import { Claim, Amparo, InternalState, Priority } from '../types';

export interface ParseResult {
  claims: Partial<Claim>[];
  amparos: Partial<Amparo>[];
  stats: {
    totalRows: number;
    totalAmparos: number;
  };
}

// Helper to parse dates (handles Excel serial dates and string formats)
// Returns ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
const parseDate = (value: any): string | null => {
  if (!value) return null;

  // Excel Serial Date
  if (typeof value === 'number') {
    const date = new Date((value - (25567 + 2)) * 86400 * 1000);
    return isValid(date) ? date.toISOString() : null;
  }

  // String DD/MM/YYYY or YYYY-MM-DD
  if (typeof value === 'string') {
    // Clean the string
    const cleanValue = value.trim();

    // Try ISO first (YYYY-MM-DD)
    let date = new Date(cleanValue);
    if (!isNaN(date.getTime()) && cleanValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      return date.toISOString();
    }

    // Try DD/MM/YYYY
    const parts = cleanValue.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      if (isValid(date)) return date.toISOString();
    }

    // Try alternative formats
    // Format: DD-MM-YYYY
    const dashParts = cleanValue.split('-');
    if (dashParts.length === 3 && dashParts[0].length === 2) {
      date = new Date(Number(dashParts[2]), Number(dashParts[1]) - 1, Number(dashParts[0]));
      if (isValid(date)) return date.toISOString();
    }
  }

  return null;
};

// Helper to parse DATE-only fields (returns YYYY-MM-DD format)
const parseDateOnly = (value: any): string | null => {
  const iso = parseDate(value);
  if (!iso) return null;
  return iso.split('T')[0]; // Extract YYYY-MM-DD only
};

// Helper to clean currency strings
// Returns number with 2 decimal places, defaults to 0 for empty values
const parseCurrency = (val: any): number => {
  if (!val || val === '' || val === '0' || val === '$0' || val === '$0.00') {
    return 0; // Default to 0 for empty/zero values
  }

  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = Number(cleaned);

  if (isNaN(num)) {
    return 0;
  }

  // Return number rounded to 2 decimal places
  return Math.round(num * 100) / 100;
};

// Helper to parse strings with trim
const parseString = (val: any): string => {
  if (!val) return '';
  return String(val).trim();
};

export const processFiles = async (softFile: File, gestionFile?: File): Promise<ParseResult> => {
  console.log('[EXCEL PARSER] Starting file processing...');
  console.log('[EXCEL PARSER] File name:', softFile.name);
  console.log('[EXCEL PARSER] File type:', softFile.type);
  console.log('[EXCEL PARSER] File size:', softFile.size);

  const workbook = await readWorkbook(softFile);

  console.log('[EXCEL PARSER] Sheet names found:', workbook.SheetNames);

  if (workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene hojas válidas');
  }

  // Parse Siniestros sheet (first sheet or named "Siniestros")
  const siniestrosSheet = workbook.Sheets[workbook.SheetNames[0]];
  const softData = XLSX.utils.sheet_to_json(siniestrosSheet);
  console.log(`[EXCEL PARSER] Siniestros sheet: ${softData.length} rows`);

  // Parse Amparos sheet if it exists
  let amparosData: any[] = [];
  const amparosSheetName = workbook.SheetNames.find(
    name => name.toLowerCase().includes('amparo') || name.toLowerCase().includes('cobertura')
  );
  if (amparosSheetName) {
    console.log(`[EXCEL PARSER] Amparos sheet found: "${amparosSheetName}"`);
    const amparosSheet = workbook.Sheets[amparosSheetName];
    amparosData = XLSX.utils.sheet_to_json(amparosSheet);
    console.log(`[EXCEL PARSER] Amparos sheet: ${amparosData.length} rows`);
  } else {
    console.log('[EXCEL PARSER] WARNING: No Amparos sheet found');
  }

  // Parse Gestión sheet if separate file provided
  let gestionData: any[] = [];
  if (gestionFile) {
    const gestionWorkbook = await readWorkbook(gestionFile);
    const gestionSheet = gestionWorkbook.Sheets[gestionWorkbook.SheetNames[0]];
    gestionData = XLSX.utils.sheet_to_json(gestionSheet);
  }

  const claims = parseSiniestros(softData, gestionData);

  // Build a map of numero_siniestro -> id_softseguros for linking amparos
  const siniestroToIdMap = new Map<string, string>();
  claims.forEach(claim => {
    if (claim.numero_siniestro && claim.id_softseguros) {
      siniestroToIdMap.set(claim.numero_siniestro, claim.id_softseguros);
    }
  });
  console.log(`[EXCEL PARSER] Built map of ${siniestroToIdMap.size} siniestro numbers to IDs`);

  const amparos = parseAmparos(amparosData, siniestroToIdMap);

  console.log(`[EXCEL PARSER] Final result: ${claims.length} claims, ${amparos.length} amparos`);

  return {
    claims,
    amparos,
    stats: {
      totalRows: softData.length,
      totalAmparos: amparosData.length,
    },
  };
};

const readWorkbook = (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        resolve(workbook);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

const parseSiniestros = (softData: any[], gestionData: any[]): Partial<Claim>[] => {
  console.log(`[SINIESTROS] Processing ${softData.length} rows`);

  if (softData.length === 0) {
    throw new Error('El archivo no contiene datos en la hoja de Siniestros');
  }

  const columns = Object.keys(softData[0]);
  console.log('[SINIESTROS] First row columns:', columns);

  // Validate required columns exist
  const requiredColumns = ['IDENTIFICADOR'];
  const missingColumns = requiredColumns.filter(
    col => !columns.some(c => c.toUpperCase() === col.toUpperCase())
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Columnas requeridas faltantes: ${missingColumns.join(', ')}. Columnas encontradas: ${columns.join(', ')}`
    );
  }

  console.log('[SINIESTROS] First row IDENTIFICADOR:', softData[0]['IDENTIFICADOR']);

  // Check for compañía column
  const companiaColumn = columns.find(
    col => col.toUpperCase().includes('COMPA') || col.toUpperCase().includes('COMPANIA')
  );
  console.log('[SINIESTROS] Compañía column found:', companiaColumn);
  console.log(
    '[SINIESTROS] Compañía value:',
    companiaColumn ? softData[0][companiaColumn] : 'NOT FOUND'
  );

  // Index Gestion by IDENTIFICADOR
  const gestionMap = new Map();
  gestionData.forEach((row: any) => {
    if (row.IDENTIFICADOR) {
      gestionMap.set(String(row.IDENTIFICADOR).trim(), row);
    }
  });

  return softData
    .map((row: any, index: number) => {
      const id = parseString(row.IDENTIFICADOR);
      if (!id) {
        if (index < 3) console.log(`[SINIESTROS] Row ${index}: Skipped - no id`);
        return null;
      }

      if (index < 3) {
        console.log(`[SINIESTROS] Row ${index}: id_softseguros = "${id}"`);
        console.log(
          `[SINIESTROS] Row ${index}: numero_siniestro_compania raw = "${row['NÚMERO DE SINIESTRO COMPAÑÍA']}"`
        );
        console.log(
          `[SINIESTROS] Row ${index}: numero_siniestro_compania parsed = "${parseString(row['NÚMERO DE SINIESTRO COMPAÑÍA'] || row['NÚMERO SINIESTRO COMPAÑÍA'] || row['NUMERO DE SINIESTRO COMPANIA'] || row['NUMERO SINIESTRO COMPANIA'])}"`
        );
      }

      const gestionRow = gestionMap.get(id);

      return {
        // Core Data (SoftSeguros-owned fields)
        id_softseguros: id,
        numero_siniestro: parseString(row['NÚMERO DE SINIESTRO']),
        poliza: parseString(row['PÓLIZA']),
        asegurado: parseString(row['NOMBRE ASEGURADO'] || row['ASEGURADO']),
        estado_softseguros: parseString(row['ESTADO']) || 'ABIERTO',
        usuario_registro: parseString(row['USUARIO REGISTRA SINIESTRO']),
        ultimo_seguimiento_raw: parseString(row['ÚLTIMO SEGUIMIENTO']),
        placa_bien: parseString(row['RIESGO']),
        ramo: parseString(row['SUBRAMO'] || row['RAMO']) || 'Sin Ramo',
        aseguradora: parseString(row['ASEGURADORA']) || 'Sin Aseguradora',
        vendedor: parseString(row['CLIENTE']),
        monto_reclamo: parseCurrency(row['MONTO RECLAMO']),
        valor_deducible: parseCurrency(row['DEDUCIBLE']),
        valor_indemnizacion: parseCurrency(row['VALOR INDEMNIZACIÓN']),
        fecha_ocurrencia: parseDate(row['FECHA DEL SINIESTRO']),

        // NEW: 14 additional SoftSeguros fields
        numero_siniestro_compania: parseString(
          row['NÚMERO DE SINIESTRO COMPAÑÍA'] ||
            row['NÚMERO SINIESTRO COMPAÑÍA'] ||
            row['NUMERO DE SINIESTRO COMPANIA'] ||
            row['NUMERO SINIESTRO COMPANIA']
        ),
        tipo_siniestro: parseString(row['TIPO SINIESTRO'] || row['TIPO DE SINIESTRO']),
        fecha_aviso: parseDateOnly(row['FECHA AVISO'] || row['FECHA DE AVISO']),
        fecha_notificacion_aseguradora: parseDateOnly(
          row['FECHA NOTIFICACIÓN ASEGURADORA'] || row['FECHA NOTIFICACION']
        ),
        proveedor_asignado: parseString(row['PROVEEDOR ASIGNADO'] || row['PROVEEDOR']),
        descripcion: parseString(row['DESCRIPCIÓN'] || row['DESCRIPCION']),
        documento_asegurado: parseString(row['DOCUMENTO ASEGURADO'] || row['CEDULA'] || row['NIT']),
        email_principal: parseString(row['EMAIL PRINCIPAL'] || row['EMAIL'] || row['CORREO']),
        celular_principal: parseString(
          row['CELULAR PRINCIPAL'] || row['CELULAR'] || row['TELEFONO']
        ),
        porcentaje_siniestralidad: parseCurrency(
          row['PORCENTAJE SINIESTRALIDAD'] || row['% SINIESTRALIDAD']
        ),
        finalizado:
          row['FINALIZADO'] === 'SI' || row['FINALIZADO'] === true || row['FINALIZADO'] === 1,
        fecha_finalizacion: parseDateOnly(row['FECHA FINALIZACIÓN'] || row['FECHA FINALIZACION']),
        coaseguros: parseCurrency(row['COASEGUROS'] || row['COASEGURO']),

        // Hybrid fields (from Gestión sheet) - kept undefined if not present
        gestion_softseguros: gestionRow ? parseString(gestionRow['GESTION']) : undefined,
        estado_gestion_softseguros: gestionRow
          ? parseString(gestionRow['ESTADO GESTION'])
          : undefined,

        // Internal fields (managed internally, not from Excel)
        tecnico_asignado: gestionRow
          ? parseString(gestionRow['Responsable']) || 'Sin Asignar'
          : 'Sin Asignar',
      } as Partial<Claim>;
    })
    .filter((c): c is Partial<Claim> => c !== null);
};

const parseAmparos = (
  amparosData: any[],
  siniestroToIdMap: Map<string, string>
): Partial<Amparo>[] => {
  console.log(`[EXCEL PARSER] Processing ${amparosData.length} amparos rows`);

  if (amparosData.length > 0) {
    console.log('[EXCEL PARSER] First row columns:', Object.keys(amparosData[0]));
    console.log('[EXCEL PARSER] First row sample:', {
      identificador: amparosData[0]['IDENTIFICADOR'] || amparosData[0]['ID'],
      numero:
        amparosData[0]['NÚMERO SINIESTRO'] ||
        amparosData[0]['NÚMERO DE SINIESTRO'] ||
        amparosData[0]['NUMERO SINIESTRO'],
      reclamante:
        amparosData[0]['NOMBRE RECLAMANTE'] ||
        amparosData[0]['NOMBRE DEL RECLAMANTE'] ||
        amparosData[0]['RECLAMANTE'],
      amparo: amparosData[0]['AMPARO'] || amparosData[0]['COBERTURA'],
      valor: amparosData[0]['VALOR'] || amparosData[0]['MONTO'],
    });
  }

  let linkedCount = 0;
  let unlinkedCount = 0;

  const parsed = amparosData
    .map((row: any, index: number) => {
      const numeroSiniestro = parseString(
        row['NÚMERO SINIESTRO'] ||
          row['NÚMERO DE SINIESTRO'] ||
          row['NUMERO SINIESTRO'] ||
          row['NUMERO DE SINIESTRO']
      );

      if (!numeroSiniestro) {
        if (index < 3) console.log(`[EXCEL PARSER] Row ${index}: Skipped - no numero_siniestro`);
        return null;
      }

      // Look up claim_id using numero_siniestro
      const claimId = siniestroToIdMap.get(numeroSiniestro);

      if (!claimId) {
        unlinkedCount++;
        if (index < 3) {
          console.log(
            `[EXCEL PARSER] Row ${index}: Cannot find claim for numero_siniestro "${numeroSiniestro}"`
          );
        }
        return null;
      }

      linkedCount++;

      const amparo = {
        claim_id: claimId,
        numero_siniestro: numeroSiniestro,
        nombre_reclamante: parseString(
          row['NOMBRE RECLAMANTE'] ||
            row['NOMBRE DEL RECLAMANTE'] ||
            row['RECLAMANTE'] ||
            row['ASEGURADO']
        ),
        amparo: parseString(row['AMPARO'] || row['COBERTURA']),
        valor: parseCurrency(row['VALOR'] || row['MONTO']),
      } as Partial<Amparo>;

      if (index < 3) {
        console.log(`[EXCEL PARSER] Row ${index} parsed:`, amparo);
      }

      return amparo;
    })
    .filter((a): a is Partial<Amparo> => a !== null);

  console.log(
    `[EXCEL PARSER] Successfully parsed ${parsed.length} amparos (${linkedCount} linked, ${unlinkedCount} unlinked)`
  );
  return parsed;
};
