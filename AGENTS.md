# AGENTS.md - Coding Guidelines

> **Repository**: `gestion_siniestros` - Vite + React 19 + TypeScript claims management system

## Build & Development Commands

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# TypeScript type checking
npx tsc --noEmit

# Run Node scripts with ts-node
npx ts-node seed.ts
npx ts-node scripts/seedSupabase.ts
```

**Testing**: No test framework configured. To add tests, use Vitest.

## Project Architecture

- **Framework**: React 19 + TypeScript + Vite 6 + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Dates**: date-fns

**Directory Structure**:
```
components/     # React components (PascalCase)
context/        # React Context providers
services/       # Business logic (excel parsing, merging)
lib/            # External configs (supabase client)
scripts/        # Seeding/utility scripts
types.ts        # TypeScript interfaces
constants.ts    # App constants, workflow phases
```

## Code Style Guidelines

### TypeScript

- **Target**: ES2022 (configured in tsconfig.json)
- **Strict mode**: Enabled where possible
- **Type imports**: Use `import type { X }` for type-only imports
- Prefer `interface` for object shapes, `type` for unions

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `Dashboard.tsx`, `ClaimsTable.tsx` |
| Hooks | camelCase with `use` prefix | `useClaims()` |
| Types/Interfaces | PascalCase | `Claim`, `InternalState` |
| Enums | PascalCase, UPPER_SNAKE members | `Priority.ALTA` |
| Constants | UPPER_SNAKE | `WORKFLOW_PHASES` |
| Functions | camelCase | `mergeClaimFromExcel` |
| Variables | camelCase | `filteredClaims` |
| Files | PascalCase (components), camelCase (utils) | `Dashboard.tsx`, `mergeService.ts` |

### Import Ordering

1. React and external libraries (alphabetical)
2. Internal types
3. Internal constants/utilities
4. Components
5. Relative imports last

```typescript
import React, { useMemo, useState } from 'react';
import { addYears } from 'date-fns';
import { DollarSign } from 'lucide-react';

import { Claim, KpiData } from '../types';
import { WORKFLOW_PHASES } from '../constants';
import FilterBar from './FilterBar';
```

### Component Patterns

- Use functional components with `React.FC<Props>` typing
- Destructure props in function parameters
- Event handlers prefixed with `handle`: `handleClick`, `handleUpdate`

```typescript
interface DashboardProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ claims, onSelectClaim }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleExpand = () => setIsExpanded(true);
  return <div>...</div>;
};
```

### Styling with Tailwind

- Use Tailwind utility classes exclusively (no inline styles)
- Color scheme: slate (backgrounds), blue/indigo/emerald/amber/rose/violet (accents)
- Standard classes:
  - Cards: `bg-slate-800 border border-slate-700 rounded-xl`
  - Text: `text-slate-100` (primary), `text-slate-400` (secondary)
  - Hover: `hover:bg-slate-800/80 transition-colors`

### Error Handling

```typescript
try {
  const { data, error } = await supabase.from('claims').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  console.error('Error in fetchClaims:', err);
  throw err;
}
```

### Database (Supabase)

- Use `supabase` client from `@/lib/supabase`
- Tables: lowercase, plural (`claims`, `amparos`, `timeline`)
- DB fields: snake_case; TypeScript: camelCase
- Use `.maybeSingle()` for single record queries
- Always handle `.select()` after mutations

### Code Organization

Use section comments for large files:
```typescript
// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================
```

- Keep functions under 50 lines when possible
- Extract complex logic into helper functions
- Comments explain "why", not "what"

## File Patterns

**New Component**:
1. Create `components/ComponentName.tsx`
2. Define Props interface at top
3. Export as default

**New Service**:
1. Create `services/serviceName.ts`
2. Export typed interfaces for return values
3. Document with JSDoc comments
4. Throw errors for critical failures

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `GEMINI_API_KEY` - For AI integrations

Access via `import.meta.env.VITE_*` in browser code, `process.env.*` in Node scripts.

## Key Types (from types.ts)

- `Claim` - Main entity (SoftSeguros + internal data)
- `InternalState` - Workflow state union type
- `Priority` - Enum for claim priority
- `User` - User with role-based access
- `TimelineEvent` - Audit trail entries
- `KpiData` - Dashboard metrics

## Common Pitfalls

- Handle Supabase errors explicitly
- `id_softseguros` is primary key, not `id_interno`
- State changes must update `lastStateChangeDate` and create history
- Excel ingestion only modifies `SOFTSEGUROS_OWNED_FIELDS`
- Never modify `INTERNAL_ONLY_FIELDS` during ingestion
