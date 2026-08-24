---
name: clp-currency
description: Rules for handling Chilean Peso (CLP) currency formatting, input parsing, and financial calculations in the app.
---

# Chilean Peso (CLP) Currency Handling

## Formatting
Always use the `formatCLP` utility — never format money inline.

```ts
// utils/formatCLP.ts
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: $1.234.567
}

export function parseCLP(input: string): number {
  // Remove dots and $ sign, return integer
  return parseInt(input.replace(/\$|\./g, ''), 10) || 0;
}

export function formatCLPShort(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return formatCLP(amount);
}
```

## Input Rules
- Money inputs must use `keyboardType="numeric"`
- Parse input immediately on change with `parseCLP()`
- Store amounts as **integers** (CLP has no decimal places)
- Display formatted value in a separate `<Text>` above the input as preview

## Calculation Rules
- **Ganancia bruta**: `precioVenta - costoMaterial`
- **Margen %**: `((precioVenta - costo) / precioVenta) * 100`
- **Balance mensual**: `sumaVentas - sumaCompras`
- Always round to nearest integer with `Math.round()`
- Never use floating point for money — store as integer CLP

## Display Colors
- Ganancia positiva → `Colors.success` (`#4CAF82`)
- Pérdida / gasto → `Colors.danger` (`#E05C5C`)
- Balance neutro → `Colors.textSecondary`

## Categories of Expenses (Gastos)
- `fardo` — Fardo de cuero completo
- `material` — Materiales (hilo, hebillas, broches, tintes)
- `herramienta` — Herramientas
- `otro` — Otros gastos

## Product Types (Artículos)
Default list (editable in settings):
- Bananera
- Coipa
- Rienda
- Cinturón
- Billetera
- Bolso
- Porta cuchillo
- Artesanía personalizada
