# 🚨 Arreglo Urgente - Google Sheets

## Problemas Detectados en tu Captura

### 1️⃣ Columna L con Texto "Gastos_Pendientes"

**Problema:** La columna L muestra "Gastos_Pendientes" en lugar de números.

**Causa:** El encabezado o las celdas tienen texto en lugar del nombre correcto.

**Solución Inmediata:**

1. Abre Google Sheets → Hoja `Gastos_Pendientes`
2. Ve a la **Columna L** (fila 1)
3. **Cambia el encabezado** a: `monto_pagado_total`
4. **Borra todas las celdas** de la columna L (desde fila 2 hacia abajo)
5. Guarda

**Luego ejecuta el script de inicialización:**

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

**Ejecutar:**
1. En Apps Script, pega esta función al final del código
2. Selecciona `inicializarMontoPagadoTotal` en el menú desplegable
3. Click en **▶️ Ejecutar**
4. Verifica los logs: Ver → Registros de ejecución

**Resultado esperado en la columna L:**
```
Fila 1: GP916600  → 0.00
Fila 2: GP062226  → 244.38  (si pagó 1 de 18 cuotas de S/ 4399)
Fila 3: GP461845  → 0.00
Fila 4: GP201599  → 0.00
...
```

---

### 2️⃣ Fechas con Timestamp Completo

**Problema:** Columnas G y H muestran `2026-01-20T08:00:00.000Z` en lugar de `2026-01-20`.

**Causa:** Google Sheets está guardando objetos Date completos en lugar de strings de fecha.

**Solución:** Ya he actualizado el script de Google Apps Script v5.0 para formatear fechas correctamente.

**Qué hacer:**

1. **Actualiza Google Apps Script** con el nuevo código del archivo `google-apps-script-NUEVO.js`
2. **Despliega** como nueva versión
3. Para las fechas existentes con timestamp, **arreglo manual:**

   **Opción A: Fórmula en Google Sheets (Rápida)**

   1. Crea una columna temporal (ej: columna P)
   2. En P2, escribe:
      ```
      =TEXT(G2,"YYYY-MM-DD")
      ```
   3. Arrastra la fórmula hacia abajo
   4. Copia la columna P
   5. Pega en columna G como **"Valores únicamente"** (Ctrl+Shift+V)
   6. Repite para columna H
   7. Borra columna P

   **Opción B: Script de Limpieza (Automática)**

```javascript
function arreglarFechas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const gastosSheet = sheet.getSheetByName('Gastos_Pendientes');

  if (!gastosSheet) {
    Logger.log('❌ No se encontró la hoja Gastos_Pendientes');
    return;
  }

  const data = gastosSheet.getDataRange().getValues();

  Logger.log('Arreglando fechas...');

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; // Saltar filas vacías

    // Columna G: Fecha_Cierre
    const fechaCierre = data[i][6];
    if (fechaCierre) {
      let fechaLimpia = '';
      if (fechaCierre instanceof Date) {
        const year = fechaCierre.getFullYear();
        const month = String(fechaCierre.getMonth() + 1).padStart(2, '0');
        const day = String(fechaCierre.getDate()).padStart(2, '0');
        fechaLimpia = `${year}-${month}-${day}`;
      } else if (typeof fechaCierre === 'string' && fechaCierre.includes('T')) {
        fechaLimpia = fechaCierre.split('T')[0];
      } else {
        fechaLimpia = fechaCierre;
      }
      gastosSheet.getRange(i + 1, 7).setValue(fechaLimpia);
    }

    // Columna H: Fecha_Pago
    const fechaPago = data[i][7];
    if (fechaPago) {
      let fechaLimpia = '';
      if (fechaPago instanceof Date) {
        const year = fechaPago.getFullYear();
        const month = String(fechaPago.getMonth() + 1).padStart(2, '0');
        const day = String(fechaPago.getDate()).padStart(2, '0');
        fechaLimpia = `${year}-${month}-${day}`;
      } else if (typeof fechaPago === 'string' && fechaPago.includes('T')) {
        fechaLimpia = fechaPago.split('T')[0];
      } else {
        fechaLimpia = fechaPago;
      }
      gastosSheet.getRange(i + 1, 8).setValue(fechaLimpia);
    }

    Logger.log(`✓ Fila ${i+1}: Fechas arregladas`);
  }

  Logger.log('✅ Fechas arregladas exitosamente');
}
```

**Ejecutar:**
1. Pega esta función en Apps Script
2. Selecciona `arreglarFechas`
3. Click en **▶️ Ejecutar**
4. Verifica que las fechas ahora muestren solo YYYY-MM-DD

---

## 🔄 Orden de Ejecución

Sigue este orden para arreglar todo:

### Paso 1: Arreglar Estructura
```
✓ Cambiar encabezado columna L a "monto_pagado_total"
✓ Borrar contenido de columna L (filas 2+)
```

### Paso 2: Ejecutar Scripts de Limpieza
```
1. Ejecutar: arreglarFechas()
2. Ejecutar: inicializarMontoPagadoTotal()
```

### Paso 3: Actualizar Apps Script
```
✓ Copiar código de google-apps-script-NUEVO.js
✓ Reemplazar todo el código actual
✓ Guardar
✓ Desplegar como nueva versión
```

### Paso 4: Verificar
```
✓ Columna G: Solo fechas YYYY-MM-DD
✓ Columna H: Solo fechas YYYY-MM-DD
✓ Columna L: Números (0.00, 244.38, etc.)
✓ Columna M: "deuda" o "suscripcion"
```

---

## 📊 Ejemplo de Cómo Debería Verse

### Antes (Incorrecto):
```
| Fecha_Cierre           | Fecha_Pago            | monto_pagado_total |
|------------------------|----------------------|--------------------|
| 2026-01-20T08:00:00.000Z | 2026-01-20T08:00:00.000Z | Gastos_Pendientes |
```

### Después (Correcto):
```
| Fecha_Cierre | Fecha_Pago | monto_pagado_total |
|--------------|------------|--------------------|
| 2026-01-20   | 2026-01-20 | 0.00               |
| 2026-01-10   | 2026-02-05 | 244.38             |
```

---

## 🧪 Validación Final

Después de ejecutar todos los pasos, verifica:

1. **Columna L:**
   ```sql
   - Fila 1 (GP916600): 0.00 (ninguna cuota pagada)
   - Fila 2 (GP062226): 244.38 (1 cuota de 18 pagada = 4399/18 = 244.38)
   ```

2. **Fechas:**
   ```sql
   - Todas en formato: YYYY-MM-DD
   - Sin "T" ni timestamp
   ```

3. **Campo Tipo:**
   ```sql
   - Claude Pro: "suscripcion"
   - Samsung Monitor: "deuda"
   - Isoface: "deuda"
   ```

---

## 🚨 Si Algo Sale Mal

### "El script de inicialización no funciona"

**Verifica:**
- El encabezado de L es exactamente `monto_pagado_total`
- La columna L está vacía (sin "Gastos_Pendientes")
- Las columnas F, J, K tienen números

### "Las fechas siguen mostrando timestamp"

**Solución:**
1. Selecciona toda la columna G
2. Formato → Número → Texto sin formato
3. Ejecuta `arreglarFechas()` de nuevo
4. Repite para columna H

### "Los nuevos registros siguen teniendo fechas con timestamp"

**Solución:**
- Asegúrate de haber actualizado Google Apps Script con el nuevo código
- Verifica que desplegaste la nueva versión
- Haz una prueba creando un nuevo gasto

---

## ✅ Checklist Completo

- [ ] Cambiar encabezado columna L a `monto_pagado_total`
- [ ] Borrar contenido de columna L (filas 2+)
- [ ] Ejecutar script `arreglarFechas()`
- [ ] Ejecutar script `inicializarMontoPagadoTotal()`
- [ ] Actualizar Google Apps Script con código nuevo
- [ ] Desplegar nueva versión en Apps Script
- [ ] Verificar que columna L tenga números
- [ ] Verificar que fechas sean solo YYYY-MM-DD
- [ ] Verificar que columna M tenga "deuda" o "suscripcion"
- [ ] Probar crear un nuevo gasto y verificar formato correcto

¡Después de esto, todo debería funcionar perfectamente! 🎉
