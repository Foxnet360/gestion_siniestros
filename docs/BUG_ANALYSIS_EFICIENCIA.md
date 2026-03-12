# Analisis de Falla: Modulo de Eficiencia por Etapas

## Problema
El modulo de "Eficiencia por Etapas" falla al cargar datos con un error de parsing JSON: `Unexpected token '<', "<!doctype "... is not valid JSON`.

## Causa Raiz
El hook `useEficienciaEtapas.ts` intenta realizar peticiones `fetch` a endpoints locales como `/api/kpis/eficiencia-etapas`. Sin embargo, el proyecto no cuenta con un servidor backend que maneje estas rutas, ni una configuracion de proxy en Vite. Por lo tanto, Vite responde con el `index.html` de la aplicacion (que comienza con `<!doctype html>`), lo cual falla al intentar ser parseado como JSON.

El resto de los KPIs en la aplicacion (segun `useKPIs.ts`) se cargan llamando directamente a servicios que interactuan con Supabase (`KpiService.ts`), sin pasar por una capa de API intermedia en el frontend.

## Hallazgos
1. `src/hooks/useEficienciaEtapas.ts`: Usa `fetch('/api/...')`.
2. `src/api/eficienciaEtapasRoutes.ts`: Contiene la lógica de los endpoints pero no está conectada a nada.
3. El proyecto es principalmente Client-side con Supabase.

## Plan de Accion
1. Crear un nuevo servicio `EficienciaEtapasService.ts` (o integrar en `KpiService.ts`) que contenga la lógica que actualmente está en `eficienciaEtapasRoutes.ts`.
2. Refactorizar `useEficienciaEtapas.ts` para que use este servicio directamente en lugar de `fetch`.
3. Verificar que las tablas de Supabase necesarias (`metricas_etapas`, `sla_por_etapa`) existan y tengan datos.
