# Bugs y Problemas Encontrados

Este documento lista los bugs y problemas encontrados en el código de la aplicación de Control Financiero.

## ✅ Bugs Resueltos (2026-02-08)

### 1. Error en Cálculo de Fecha de Cierre de Tarjeta ✅ RESUELTO
**Ubicación:** `components/forms/UnifiedEntryForm.tsx:65`

**Problema:**
```typescript
const cierreDate = new Date(anio, dia <= card.dia_cierre ? mes : mes + 1, card.dia_cierre);
```

La lógica usaba `dia` sin definirla primero.

**Impacto:** Las fechas de cierre y pago de tarjetas se calculaban incorrectamente.

**Solución Aplicada:**
```typescript
const dia_gasto = hoy.getDate();
const cierreDate = new Date(anio, dia_gasto <= card.dia_cierre ? mes : mes + 1, card.dia_cierre);
```

**Estado:** ✅ RESUELTO

---

### 2. Función generateId() Puede Generar IDs Duplicados ✅ RESUELTO
**Ubicación:** `utils/format.ts:20-23`

**Problema:**
```typescript
export const generateId = () => {
  return 'GP' + Date.now().toString().substring(7);
};
```

- Si se llama múltiples veces en el mismo milisegundo, genera IDs duplicados
- El `.substring(7)` puede generar IDs muy cortos

**Impacto:** Posibles colisiones de IDs en transacciones.

**Solución Aplicada:**
```typescript
export const generateId = () => {
  return 'GP' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
};
```

**Estado:** ✅ RESUELTO

---

### 3. División por Cero en Cálculo de Deuda
**Ubicación:** `App.tsx:162`

**Problema:**
```typescript
const pagado = Number(p.cuotas_pagadas) * (monto/cuotas);
```

Si `num_cuotas` es 0, se produce una división por cero que resulta en `Infinity` o `NaN`.

**Impacto:** La interfaz puede mostrar valores inválidos (NaN, Infinity) en la deuda.

**Solución Sugerida:**
```typescript
const cuotas = Number(p.num_cuotas) || 1; // Default to 1 to avoid division by zero
const pagado = Number(p.cuotas_pagadas) * (monto/cuotas);
```

---

### 4. Sin Manejo de Errores al Parsear JSON de localStorage
**Ubicación:** `App.tsx:101-108`

**Problema:**
```typescript
const storedCards = localStorage.getItem('cards');
if (storedCards) setCards(JSON.parse(storedCards));

const storedPending = localStorage.getItem('pendientes');
if (storedPending) setPendingExpenses(JSON.parse(storedPending));

const storedHistory = localStorage.getItem('history');
if (storedHistory) setHistory(JSON.parse(storedHistory));
```

Si el JSON en localStorage está corrupto, `JSON.parse()` lanza una excepción que crashea la aplicación.

**Impacto:** La aplicación puede fallar completamente al cargar si hay datos corruptos en localStorage.

**Solución Sugerida:**
```typescript
try {
  const storedCards = localStorage.getItem('cards');
  if (storedCards) setCards(JSON.parse(storedCards));
} catch (error) {
  console.error('Error parsing stored cards:', error);
  localStorage.removeItem('cards');
}
```

---

## 🟡 Bugs Moderados

### 5. Problema con Zonas Horarias en Dashboard
**Ubicación:** `components/Dashboard.tsx:27-32`

**Problema:**
```typescript
// Fix timezone issue by checking raw string if needed, but simplified here
if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
```

El comentario admite que hay un problema con zonas horarias, pero no se soluciona. Esto puede causar que transacciones se asignen al mes incorrecto.

**Impacto:** Los reportes mensuales pueden ser inexactos.

**Solución Sugerida:**
Usar `fecha.split('-')` para extraer año y mes directamente del string ISO sin crear un objeto Date.

---

### 6. Pagos Parciales Menores a Una Cuota No se Registran
**Ubicación:** `components/forms/PaymentForm.tsx:57`

**Problema:**
```typescript
else if (paymentType === 'Parcial') {
  newCuotasPagadas += Math.floor(montoPagado / montoCuota);
}
```

Si pagas S/ 50 pero la cuota es S/ 100, `Math.floor(0.5) = 0`, entonces el pago no se registra en absoluto.

**Impacto:** Los usuarios pueden realizar pagos que no se reflejan en el sistema.

**Solución Sugerida:**
Mantener un campo adicional de "monto_pagado_extra" o calcular el progreso de forma proporcional.

---

### 7. Falta de Validación de Datos de API
**Ubicación:** Múltiples archivos (`App.tsx`, `googleSheetService.ts`)

**Problema:**
No se valida que los datos recibidos de la API tengan el formato esperado. Se asume que siempre vendrán correctos.

**Impacto:** Si la API devuelve datos malformados, puede causar errores en runtime.

**Solución Sugerida:**
Implementar validación de tipos con Zod o similar, o al menos validaciones básicas.

---

## 🟢 Mejoras Sugeridas

### 8. Sin Tests Automatizados
**Problema:** El proyecto no tenía ningún test antes de esta revisión.

**Solución Implementada:**
- Se agregó Vitest como framework de testing
- Se crearon tests para `utils/format.ts`
- Se configuró el entorno de testing

**Próximos Pasos:**
- Agregar tests para componentes React
- Agregar tests de integración
- Configurar CI/CD para ejecutar tests automáticamente

---

## Resumen

- **Bugs Críticos:** 4
- **Bugs Moderados:** 3
- **Mejoras:** 1

**Prioridad de Corrección:**
1. Bug #4 (JSON parsing) - Puede crashear la app
2. Bug #3 (división por cero) - Afecta cálculos financieros
3. Bug #1 (fechas de cierre) - Afecta funcionalidad principal
4. Bug #2 (IDs duplicados) - Puede causar problemas de datos
5. Bug #6 (pagos parciales) - Afecta experiencia de usuario
6. Bug #5 (zonas horarias) - Afecta reportes
7. Bug #7 (validación) - Prevención de errores futuros
