# Design: Visualizar Casos con Riesgo de Prescripción

## Context
El sistema ya detecta casos próximos a prescribir (alerta existente). Ahora necesitamos una vista dedicada para gestionarlos. Se utilizará la arquitectura existente de Frontend (React/Next.js o similar, dado el contexto de `.tsx` files).

## Goals / Non-Goals
**Goals:**
- Crear una nueva página `/siniestros/riesgo-prescripcion`.
- Implementar la lógica de ordenamiento y filtrado requerida.
- Reutilizar componentes de UI existentes (Tablas, Filtros).

**Non-Goals:**
- Refactorizar el sistema de alertas existente (solo enlazamos la acción).
- Crear nuevos endpoints de backend (se asume que se puede filtrar/ordenar con los datos existentes o ajustando las queries actuales, o mockeando si es frontend-only por ahora). *Nota: Si se requiere backend, se especificará en tareas.*

## Decisions

### 1. Nueva Ruta y Página
Se creará una nueva página `PrescriptionRiskPage` (o similar) en la estructura de rutas.
- **Ruta:** `/siniestros/riesgo-prescripcion`
- **Componente:** `PrescriptionRiskPage.tsx`

### 2. Gestión de Estado (Frontend)
Se utilizará un estado local o hook para manejar:
- La lista de siniestros (filtrada).
- Los valores de los filtros activos.
- El ordenamiento (default: `fecha_prescripcion` ASC).

### 3. Filtros
Se implementará una barra de filtros que permita seleccionar:
- Cliente, Estado Siniestro, Ramo, Aseguradora, Estado (Lugar), Técnico, Vendedor.
Los selectores se llenarán con los valores únicos disponibles en los datos o catálogos existentes.

### 4. Navegación
En el componente que muestra la alerta (Dashboard o Header), se actualizará el botón "Ver casos" para usar `Link` o `useNavigate` hacia la nueva ruta.

## Risks / Trade-offs
- **Performance:** Si la carga de todos los siniestros es pesada, el filtrado en cliente puede ser lento.
    - *Mitigación:* Si es posible, aplicar filtros en backend. Si no, usar memoización y virtualización en la tabla.
- **Consistencia de Datos:** La fecha de prescripción debe calcularse consistentemente (Fecha Siniestro + 2 años).
