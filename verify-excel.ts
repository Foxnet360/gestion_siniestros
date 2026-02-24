import * as XLSX from 'xlsx';

const wb = XLSX.readFile('Borrar/Descarga Softseguros.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

console.log('=== ANÁLISIS DEL EXCEL ===\n');
console.log('Total filas:', data.length);
console.log('\n=== COLUMNAS (primera fila) ===');
if (data.length > 0) {
  data[0].forEach((col, idx) => {
    console.log(`${idx.toString().padStart(2)}: "${col}"`);
  });
}

console.log('\n=== PRIMERA FILA DE DATOS ===');
if (data.length > 1) {
  data[1].forEach((val, idx) => {
    const colName = data[0][idx] || `Col ${idx}`;
    console.log(`${idx.toString().padStart(2)} [${colName}]: "${val}"`);
  });
}

console.log('\n=== BUSCANDO COLUMNA COMPAÑÍA ===');
const companiaIndex = data[0].findIndex(
  (col: string) => col && col.toString().toLowerCase().includes('compañía')
);
console.log('Índice columna compañía:', companiaIndex);
if (companiaIndex >= 0) {
  console.log('Nombre columna:', data[0][companiaIndex]);
  console.log('Valor primera fila:', data[1]?.[companiaIndex]);
}
