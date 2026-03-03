import type { Claim } from '../types';

/**
 * Mapeo de campos camelCase (código) ↔ lowercase (base de datos PostgreSQL)
 *
 * PostgreSQL convierte automáticamente identificadores sin comillas a minúsculas.
 * Esta utilidad maneja la conversión bidireccional entre los nombres de campos
 * usados en TypeScript (camelCase) y los nombres reales en la base de datos.
 */

interface DbFieldMapping {
  [camelCase: string]: string;
}

// Mapeo: camelCase → lowercase (como están en PostgreSQL)
const CAMEL_TO_DB: DbFieldMapping = {
  lastStateChangeDate: 'laststatechangedate',
  updatedAt: 'updatedat',
};

// Mapeo inverso: lowercase → camelCase
const DB_TO_CAMEL: DbFieldMapping = Object.entries(CAMEL_TO_DB).reduce((acc, [camel, db]) => {
  acc[db] = camel;
  return acc;
}, {} as DbFieldMapping);

/**
 * Convierte un objeto Claim de camelCase a formato de base de datos (lowercase)
 * Usar ANTES de enviar datos a Supabase (INSERT/UPDATE)
 */
export function toDbFormat(claim: Partial<Claim>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(claim)) {
    // Si el campo tiene mapeo, usar el nombre de BD; si no, mantener el original
    const dbFieldName = CAMEL_TO_DB[key] || key;
    result[dbFieldName] = value;
  }

  return result;
}

/**
 * Convierte un objeto de base de datos (lowercase) a camelCase (formato Claim)
 * Usar DESPUÉS de recibir datos de Supabase (SELECT)
 */
export function fromDbFormat(dbRecord: Record<string, any>): Claim {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(dbRecord)) {
    // Si el campo tiene mapeo inverso, usar camelCase; si no, mantener el original
    const camelFieldName = DB_TO_CAMEL[key] || key;
    result[camelFieldName] = value;
  }

  return result as Claim;
}

/**
 * Convierte un array de registros de base de datos a formato Claim
 */
export function fromDbFormatArray(records: Record<string, any>[]): Claim[] {
  return records.map(fromDbFormat);
}

/**
 * Convierte un array de Claims a formato de base de datos
 */
export function toDbFormatArray(claims: Partial<Claim>[]): Record<string, any>[] {
  return claims.map(toDbFormat);
}
