// INTEGRACIÓN DEL DASHBOARD DE EFICIENCIA POR ETAPAS
// =====================================================

// PASO 1: Agregar import en App.tsx
// ----------------------------------
// Agregar esta línea junto a los otros imports de Dashboard:

import { DashboardEficienciaEtapas } from './components/Dashboard/DashboardEficienciaEtapas';

// PASO 2: Agregar case en el switch de renderContent() en App.tsx
// ----------------------------------------------------------------
// Ubicación: Después del case 'sla-dashboard' (línea ~205)

case 'sla-dashboard':
return <SlaDashboard />;
case 'eficiencia-etapas':
return <DashboardEficienciaEtapas />;

// PASO 3: Agregar ícono en Sidebar.tsx
// -------------------------------------
// Agregar import:
import { TrendingUp } from 'lucide-react';

// PASO 4: Agregar menú en Sidebar.tsx
// ------------------------------------
// Ubicación: Después de la línea 50 (después de sla-dashboard)

if (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE') {
items.push({ id: 'manager-dashboard', label: 'Dashboard Gerencial', icon: LineChart });
items.push({ id: 'sla-dashboard', label: 'Dashboard SLA/KPIs', icon: BarChart3 });
items.push({ id: 'eficiencia-etapas', label: 'Eficiencia por Etapas', icon: TrendingUp });
}

// PASO 5: Verificar que el componente exporte correctamente
// ----------------------------------------------------------
// En DashboardEficienciaEtapas.tsx, asegurarse de que tiene:

export const DashboardEficienciaEtapas: React.FC = () => {
// ... código del componente
};

// ALTERNATIVA: Usar React Router (si el proyecto lo usa)
// -------------------------------------------------------
// Si el proyecto usa React Router en lugar de currentView:

import { Route, Routes } from 'react-router-dom';
import { DashboardEficienciaEtapas } from './components/Dashboard/DashboardEficienciaEtapas';

// En el componente Routes:
<Routes>
<Route path="/" element={<Dashboard />} />
<Route path="/eficiencia-etapas" element={<DashboardEficienciaEtapas />} />
// ... otras rutas
</Routes>

// VERIFICACIÓN RÁPIDA
// -------------------
// Después de hacer los cambios:

1. Reiniciar el servidor de desarrollo: npm run dev
2. Ir a la aplicación
3. Verificar que aparece "Eficiencia por Etapas" en el menú lateral
4. Hacer clic y verificar que carga el dashboard

// POSIBLES ERRORES Y SOLUCIONES
// ------------------------------

// Error: "Cannot find module './components/Dashboard/DashboardEficienciaEtapas'"
// Solución: Verificar que el archivo existe en la ruta correcta

// Error: "DashboardEficienciaEtapas is not defined"
// Solución: Verificar que el import esté correcto y el nombre coincide

// Error: "Cannot read property of undefined"
// Solución: Verificar que la base de datos tenga las tablas creadas
