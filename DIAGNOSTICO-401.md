# 🔍 DIAGNÓSTICO DE ERROR 401

## Sigue fallando? Hagamos un diagnóstico paso a paso:

### Paso 1: Verificar en el navegador

1. Abre tu aplicación en el navegador
2. Presiona **F12** (DevTools)
3. Ve a la pestaña **Console**
4. Pega este código y presiona Enter:

```javascript
const SUPABASE_URL = 'https://yxjeuyouhhhptwrllvzh.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4amV1eW91aGhocHR3cmxsdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDkxNjgsImV4cCI6MjA4NjMyNTE2OH0.B5DcmzmGu5cUavVvhzPgGPVukqrj56jKs28fATdy-e8';

fetch(`${SUPABASE_URL}/rest/v1/claims?select=id_softseguros&limit=1`, {
  method: 'GET',
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
})
  .then(r => {
    console.log('Status:', r.status);
    if (r.status === 200) {
      console.log('✅ CONEXIÓN EXITOSA');
      return r.json();
    } else {
      console.log('❌ ERROR:', r.status);
      return r.text();
    }
  })
  .then(data => console.log('Respuesta:', data))
  .catch(e => console.log('❌ Error:', e.message));
```

### Paso 2: Interpretar resultados

**Si dice "Status: 200" y muestra datos:**

- ✅ La conexión funciona
- ✅ El problema es en las relaciones (state_history, timeline)
- Solución: Verificar que existan esas tablas

**Si dice "Status: 401":**

- ❌ RLS está activado
- Solución: Ejecutar en Supabase SQL Editor:

```sql
ALTER TABLE claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE state_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline DISABLE ROW LEVEL SECURITY;
```

**Si dice "Status: 404":**

- ❌ La tabla "claims" no existe
- Solución: Crear las tablas primero

**Si dice "Failed to fetch" o error de red:**

- ❌ Problema de CORS o conexión
- Solución: Verificar que el dominio esté en Supabase CORS

### Paso 3: Verificar tablas relacionadas

En Supabase SQL Editor, ejecuta:

```sql
-- Verificar que existan las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Debe mostrar: claims, state_history, timeline, amparos
```

### Paso 4: Verificar datos

```sql
-- Contar registros
SELECT 'claims' as tabla, count(*) as total FROM claims
UNION ALL
SELECT 'state_history', count(*) FROM state_history
UNION ALL
SELECT 'timeline', count(*) FROM timeline;
```

Si todo está en 0, inserta datos de prueba:

```sql
INSERT INTO claims (id_softseguros, numero_siniestro, poliza, asegurado, aseguradora, ramo, estado_interno, estado_softseguros)
VALUES ('TEST-001', 'SIN-001', 'POL-001', 'Prueba', 'Allianz', 'Autos', 'RADICACIÓN COMPAÑÍA', 'ABIERTO');
```

---

## 🆘 Si nada funciona:

1. **Abre el archivo:** `diagnostico-supabase.js`
2. **Copia todo el contenido**
3. **Pégalo en la consola del navegador (F12)**
4. **Presiona Enter**
5. **Mándame una captura de pantalla** de lo que sale

Así podré ver exactamente qué está fallando.
