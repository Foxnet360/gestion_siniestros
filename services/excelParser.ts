import * as XLSX from 'xlsx';
import { addYears, parse, isValid } from 'date-fns';
import { Claim, InternalState, Priority } from '../types';

export interface ParseResult {
    claims: Claim[];
    stats: {
        totalRows: number;
        newClaims: number;
        updatedClaims: number;
    };
}

// Helper to parse dates (handles Excel serial dates and string formats)
const parseDate = (value: any): string => {
    if (!value) return new Date().toISOString();

    // Excel Serial Date
    if (typeof value === 'number') {
        const date = new Date((value - (25567 + 2)) * 86400 * 1000);
        return isValid(date) ? date.toISOString() : new Date().toISOString();
    }

    // String DD/MM/YYYY or YYYY-MM-DD
    if (typeof value === 'string') {
        // Try ISO first
        let date = new Date(value);
        if (!isNaN(date.getTime())) return date.toISOString();

        // Try DD/MM/YYYY
        // Note: 'date-fns' parse requires format string
        // Assuming simple split for now to avoid complex pattern matching without heavy locale imports
        const parts = value.split('/');
        if (parts.length === 3) {
            // DD/MM/YYYY
            date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            if (isValid(date)) return date.toISOString();
        }
    }

    return new Date().toISOString();
};

export const processFiles = async (softFile: File, gestionFile: File): Promise<ParseResult> => {
    const softData = await readFile(softFile);
    const gestionData = await readFile(gestionFile);

    const claims = mergeData(softData, gestionData);

    return {
        claims,
        stats: {
            totalRows: softData.length,
            newClaims: 0,
            updatedClaims: 0
        }
    };
};

const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
};

const mergeData = (softData: any[], gestionData: any[]): Claim[] => {
    // Index Gestion by IDENTIFICADOR
    const gestionMap = new Map();
    gestionData.forEach((row: any) => {
        if (row.IDENTIFICADOR) {
            gestionMap.set(String(row.IDENTIFICADOR).trim(), row);
        }
    });

    return softData.map((row: any) => {
        const id = String(row.IDENTIFICADOR || '').trim();
        if (!id) return null; // Skip invalid rows

        const gestionRow = gestionMap.get(id);
        const fechaSiniestroStr = parseDate(row['FECHA DEL SINIESTRO']);

        // Default values if missing
        const ramo = row['SUBRAMO'] || row['RAMO'] || 'Sin Ramo';
        const aseguradora = row['ASEGURADORA'] || 'Sin Aseguradora';
        // Helper to clean currency strings
        const parseCurrency = (val: any) => Number(String(val || '0').replace(/[^0-9.-]+/g, "")) || 0;

        return {
            // Core Data (Softseguros)
            id_softseguros: id,
            numero_siniestro: String(row['NÚMERO DE SINIESTRO'] || ''),
            poliza: String(row['PÓLIZA'] || ''),
            asegurado: String(row['NOMBRE ASEGURADO'] || row['ASEGURADO'] || ''),
            estado_softseguros: String(row['ESTADO'] || 'ABIERTO'),
            usuario_registro: String(row['USUARIO REGISTRA SINIESTRO'] || ''),
            ultimo_seguimiento_raw: String(row['ÚLTIMO SEGUIMIENTO'] || ''),
            placa_bien: String(row['RIESGO'] || ''),

            // Grouping
            ramo,
            aseguradora,
            vendedor: String(row['CLIENTE'] || ''),
            tecnico_asignado: gestionRow ? String(gestionRow['Responsable'] || 'Sin Asignar') : 'Sin Asignar',
            aliado_origen: aseguradora,

            // Internal Management
            id_interno: `INT-${id}`,
            estado_interno: (gestionRow ? String(gestionRow['ESTADO ULTIMA GESTION'] || 'PENDIENTE') : 'PENDIENTE') as InternalState,
            lastStateChangeDate: parseDate(gestionRow ? gestionRow['Fecha Ultimo Seguimiento'] : undefined),
            stateHistory: [],

            prioridad: Priority.MEDIA,
            monto_reclamo: parseCurrency(row['MONTO RECLAMO']),
            valor_deducible: parseCurrency(row['DEDUCIBLE']),
            valor_indemnizacion: parseCurrency(row['VALOR INDEMNIZACIÓN']),
            fecha_ocurrencia: fechaSiniestroStr,
            updatedAt: new Date().toISOString(),
            timeline: []
        } as Claim;
    }).filter((c): c is Claim => c !== null);
};
