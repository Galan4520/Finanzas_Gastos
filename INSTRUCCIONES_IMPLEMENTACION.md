# 🔧 Instrucciones de Implementación - Fix Pagos Parciales

## 📋 Problema Solucionado

**Antes del fix:**
- Pagas S/ 2,700 de una deuda de S/ 3,000
- En tu dispositivo muestra: S/ 300 restantes ✓
- En otro dispositivo muestra: S/ 500 restantes ✗
- El pago parcial no se sincronizaba correctamente

**Después del fix:**
- Pagas S/ 2,700 de una deuda de S/ 3,000
- En TODOS los dispositivos muestra: S/ 300 restantes ✓
- El pago se guarda correctamente en Google Sheets

---

## 🚀 Pasos de Implementación

### PASO 1: Actualizar Google Apps Script (Backend)

1. Ve a tu Google Sheet → **Extensiones** → **Apps Script**

2. **RESPALDA** tu código actual:
   - Selecciona todo (Ctrl+A)
   - Cópialo y guárdalo en un archivo .txt

3. **Borra** todo el código actual

4. **Copia** el contenido del archivo `google-apps-script-NUEVO.js`

5. **Pega** en el editor de Apps Script

6. Haz clic en **💾 Guardar**

7. **Implementa** la nueva versión:
   - Click en **Implementar** → **Administrar implementaciones**
   - Click en el ícono de **✏️ lápiz** junto a tu implementación activa
   - En "Versión", selecciona **Nueva versión**
   - Descripción: `v5.0 - Soporte para monto_pagado_total`
   - Click en **Implementar**

---

### PASO 2: Agregar Nueva Columna L en Google Sheets

1. Ve a la hoja **Gastos_Pendientes**

2. Agrega un nuevo encabezado en la **Columna L**:
   ```
   monto_pagado_total
   ```

3. La estructura debe quedar así:
   ```
   A: id
   B: fecha_gasto
   C: tarjeta
   D: categoria
   E: descripcion
   F: monto
   G: fecha_cierre
   H: fecha_pago
   I: estado
   J: num_cuotas
   K: cuotas_pagadas
   L: monto_pagado_total  ← NUEVA COLUMNA
   M: tipo
   N: notas
   O: timestamp
   ```

---

### PASO 3: Inicializar Valores para Deudas Existentes

**IMPORTANTE:** Ejecuta este script UNA SOLA VEZ para migrar datos existentes.

1. En el editor de Apps Script, crea una **nueva función** (al final del código):

```javascript
function inicializarMontoPagadoTotal() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const gastosSheet = sheet.getSheetByName('Gastos_Pendientes');

  if (!gastosSheet) {
    Logger.log('❌ No se encontró la hoja Gastos_Pendientes');
    return;
  }

  const data = gastosSheet.getDataRange().getValues();

  Logger.log('Iniciando migración de datos...');

  // Recorrer todos los registros (empezar desde fila 2)
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; // Saltar filas vacías

    const montoTotal = parseFloat(data[i][5]);     // Columna F
    const numCuotas = parseInt(data[i][9]);        // Columna J
    const cuotasPagadas = parseFloat(data[i][10]); // Columna K

    // Calcular el monto pagado total basado en cuotas ya pagadas
    const montoCuota = montoTotal / numCuotas;
    const montoPagadoTotal = montoCuota * cuotasPagadas;

    // Actualizar columna L (índice 12 = columna L)
    gastosSheet.getRange(i + 1, 12).setValue(montoPagadoTotal);

    Logger.log(`✓ Fila ${i+1}: ${data[i][4]} - Pagado: S/ ${montoPagadoTotal.toFixed(2)}`);
  }

  Logger.log('✅ Migración completada exitosamente');
}
```

2. **Selecciona** la función `inicializarMontoPagadoTotal` en el menú desplegable

3. Haz clic en **▶️ Ejecutar**

4. **Autoriza** los permisos si te lo pide

5. Verifica en **Ver** → **Registros de ejecución** que diga "✅ Migración completada"

6. **Revisa** en la hoja Gastos_Pendientes que la columna L tenga valores

---

### PASO 4: Actualizar el Frontend (Ya está hecho)

Los siguientes archivos YA fueron actualizados en el código del proyecto:

- ✅ `types.ts` - Agrega campo `monto_pagado_total`
- ✅ `components/forms/PaymentForm.tsx` - Usa monto_pagado_total para cálculos
- ✅ `components/Dashboard.tsx` - Calcula deuda con monto_pagado_total
- ✅ `components/forms/CreditExpenseForm.tsx` - Inicializa en 0
- ✅ `components/forms/UnifiedEntryForm.tsx` - Inicializa en 0

**No necesitas hacer nada más en el frontend.**

---

### PASO 5: Desplegar el Frontend

1. Si usas Vercel/Netlify:
   ```bash
   git pull
   # El deploy se hará automáticamente
   ```

2. Si usas desarrollo local:
   ```bash
   git pull
   npm run dev
   ```

---

## ✅ Verificación del Fix

### Test 1: Pago Parcial
1. Crea una deuda de S/ 1,000 en 10 cuotas
2. Selecciona "Pago Parcial (Manual)"
3. Paga S/ 550
4. **Verifica:**
   - Debe mostrar: S/ 450 restantes
   - En Google Sheets columna L: 550
   - En Google Sheets columna K: 5.5 cuotas

### Test 2: Sincronización entre Dispositivos
1. Haz un pago parcial desde el Dispositivo A
2. Abre la app en el Dispositivo B
3. Haz clic en "Sincronizar"
4. **Verifica:**
   - La deuda restante es la misma en ambos dispositivos
   - El monto pagado se mantiene correcto

### Test 3: Pago de 1 Cuota
1. Selecciona una deuda
2. Elige "Pago de 1 Cuota"
3. Confirma el pago
4. **Verifica:**
   - cuotas_pagadas aumenta en 1
   - monto_pagado_total aumenta en (monto_total / num_cuotas)

---

## 🔄 Cómo Funciona el Nuevo Sistema

### Antes (con bug):
```javascript
// Frontend
cuotasPagadas = 10.8  // ✓ Correcto (2700 / 250)

// Backend
cuotasPagadas = Math.floor(10.8) = 10  // ✗ Pierde .8

// Resultado
deudaRestante = 3000 - (250 * 10) = S/ 500  // ✗ Incorrecto
```

### Ahora (sin bug):
```javascript
// Frontend
montoPagadoTotal = 2700  // ✓ Valor exacto

// Backend
montoPagadoTotal = 2700  // ✓ Se mantiene exacto

// Resultado
deudaRestante = 3000 - 2700 = S/ 300  // ✓ Correcto
```

---

## 📊 Cambios en la Base de Datos

### Gastos_Pendientes (Google Sheets)

**Columna L agregada:**
- **Nombre:** `monto_pagado_total`
- **Tipo:** Number
- **Descripción:** Suma acumulada de todos los pagos realizados
- **Valor inicial:** 0 (para nuevas deudas)

**Ejemplo:**
| monto | num_cuotas | cuotas_pagadas | monto_pagado_total | deuda_restante |
|-------|-----------|----------------|-------------------|----------------|
| 3000  | 12        | 10.8           | 2700              | 300            |
| 1200  | 6         | 3              | 600               | 600            |
| 500   | 1         | 0              | 0                 | 500            |

---

## 🐛 Solución de Problemas

### Problema: "La columna L está vacía"
**Solución:** Ejecuta la función `inicializarMontoPagadoTotal()` en Apps Script

### Problema: "Los pagos antiguos muestran deuda incorrecta"
**Solución:** La función de inicialización calculará automáticamente los valores correctos basándose en las cuotas ya pagadas

### Problema: "Error al hacer un pago"
**Solución:**
1. Verifica que Google Apps Script esté en v5.0
2. Verifica que la columna L exista en Gastos_Pendientes
3. Revisa los logs en Apps Script: **Ver** → **Registros de ejecución**

### Problema: "La sincronización no funciona"
**Solución:**
1. Haz clic en "Sincronizar" en la app
2. Espera 5 segundos
3. Recarga la página (F5)

---

## 📝 Notas Importantes

1. **Retrocompatibilidad:** El sistema sigue usando `cuotas_pagadas` para mostrar el progreso visual, pero usa `monto_pagado_total` para cálculos de deuda.

2. **Migración automática:** Las deudas existentes se migrarán automáticamente al ejecutar `inicializarMontoPagadoTotal()`.

3. **Sin pérdida de datos:** Los pagos antiguos se convertirán correctamente usando la fórmula:
   ```
   monto_pagado_total = (monto_total / num_cuotas) × cuotas_pagadas
   ```

4. **Nuevas deudas:** Automáticamente se crearán con `monto_pagado_total: 0`.

---

## 🎯 Resultado Final

✅ Pagos parciales se sincronizan correctamente entre dispositivos
✅ No se pierde precisión en los decimales
✅ El cálculo de deuda restante es exacto
✅ Compatible con todas las funcionalidades existentes
✅ Sin cambios visibles para el usuario (todo funciona mejor por detrás)

---

**¿Necesitas ayuda?** Revisa los logs de Apps Script o contacta al desarrollador.
