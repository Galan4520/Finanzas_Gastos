# 🔧 Solución: Diferentes Versiones en Chrome vs Edge

## 🎯 Tu Problema

> "En Edge y en mi celular la deuda desapareció, pero en Google Chrome sale la deuda y 1 suscripción. La suscripción ahora está en la deuda pendiente y debería estar en el apartado suscripción."

### Causa del Problema

Este problema ocurre por **caché desincronizado** en cada navegador:

```
Chrome:      localStorage con datos de hace 2 días
Edge:        localStorage vacío o con datos de hace 1 semana
Celular:     localStorage con datos de hace 3 días
Google Sheets: ← Fuente de verdad (datos actuales)
```

Cada navegador tiene su propio `localStorage` y pueden mostrar versiones diferentes de tus datos.

---

## ✅ Solución Rápida (Panel de Depuración)

He agregado un **Panel de Depuración** que te ayudará a solucionar esto en segundos.

### Paso 1: Abrir el Panel

Después de hacer deploy, verás un **botón flotante** en la esquina inferior derecha:

- **🟢 Azul/Verde:** Todo bien
- **🔴 Rojo:** Problemas detectados (datos faltantes o incorrectos)

**Haz clic** en el botón.

### Paso 2: Ver el Diagnóstico

El panel te mostrará:

```
ESTADO DE DATOS
Deudas:                    2
Suscripciones:             1
Sin campo tipo:            3 ⚠️  ← PROBLEMA
Sin monto_pagado_total:    2 ⚠️  ← PROBLEMA
```

Si ves **⚠️**, significa que hay datos incorrectos.

### Paso 3: Solucionar

**Opción 1: Forzar Sincronización** (intenta esto primero)
```
Click en "Forzar Sincronización"
→ Re-descarga datos desde Google Sheets
→ Actualiza localStorage
```

**Opción 2: Limpiar y Re-sincronizar** (si la opción 1 no funciona)
```
Click en "Limpiar y Re-sincronizar"
→ Borra TODO el localStorage
→ Re-descarga datos desde Google Sheets
→ Recarga la página automáticamente
```

### Paso 4: Hacer lo Mismo en Todos los Navegadores

**Importante:** Debes hacer esto en **cada navegador/dispositivo**:

1. **Chrome (PC)** → Abre la app → Panel de Depuración → Limpiar y Re-sincronizar
2. **Edge (PC)** → Abre la app → Panel de Depuración → Limpiar y Re-sincronizar
3. **Celular** → Abre la app → Panel de Depuración → Limpiar y Re-sincronizar

Después de esto, **todos** los navegadores mostrarán los mismos datos.

---

## 🔍 Problema: Suscripciones en Lugar Equivocado

### Síntoma

Las suscripciones aparecen en la pestaña **"Deudas"** en lugar de **"Suscripciones"**.

### Causa

El campo `tipo` en Google Sheets está vacío o dice "deuda" cuando debería decir "suscripcion".

### Solución

**Opción A: Desde la App (Recomendado)**

1. Abre el **Panel de Depuración**
2. Si dice `Sin campo tipo: 3 ⚠️`, significa que 3 registros no tienen el campo `tipo`
3. Click en **"Limpiar y Re-sincronizar"**
4. El sistema asignará automáticamente `tipo: 'deuda'` a los registros sin tipo

**Luego, manualmente:**
1. Ve a Google Sheets → Hoja `Gastos_Pendientes`
2. Busca la columna **M** (tipo)
3. Para las suscripciones (Netflix, Spotify, etc.), cambia el valor a: `suscripcion`
4. Guarda
5. Regresa a la app → Panel de Depuración → Forzar Sincronización

**Opción B: Directamente en Google Sheets**

1. Abre Google Sheets
2. Ve a la hoja **Gastos_Pendientes**
3. Verifica que la columna **M** tenga el encabezado: `tipo`
4. Para cada fila:
   - Si es una compra a cuotas → `deuda`
   - Si es una suscripción mensual → `suscripcion`
5. Guarda
6. En la app → Forzar Sincronización

**Ejemplo:**

| descripcion | monto | num_cuotas | **tipo** |
|-------------|-------|------------|----------|
| Samsung Monitor | 4399.00 | 18 | deuda |
| Netflix Premium | 55.00 | 1 | suscripcion |
| Spotify | 19.90 | 1 | suscripcion |
| iPhone 15 | 5000.00 | 12 | deuda |

---

## 🛠️ Verificación de Estructura de Google Sheets

Asegúrate de que tu hoja `Gastos_Pendientes` tenga esta estructura:

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
L: monto_pagado_total  ← NUEVA COLUMNA (debe existir)
M: tipo                 ← DEBE TENER "deuda" o "suscripcion"
N: notas
O: timestamp
```

### Si la columna L no existe:

1. Agrega una nueva columna después de `cuotas_pagadas`
2. Nómbrala: `monto_pagado_total`
3. Ejecuta el script de inicialización (ver `INSTRUCCIONES_IMPLEMENTACION.md`)

---

## 🧪 Verificar que Todo Funciona

### Test 1: Datos Consistentes entre Navegadores

1. Abre la app en **Chrome**
2. Anota cuántas deudas y suscripciones ves
3. Abre la app en **Edge** (o celular)
4. Deberías ver **exactamente** los mismos números

**Si no coinciden:**
- Usa "Limpiar y Re-sincronizar" en ambos navegadores

### Test 2: Suscripciones en el Lugar Correcto

1. Ve a la pestaña **"Deudas"**
2. Haz clic en la sub-pestaña **"Suscripciones"**
3. Deberías ver solo suscripciones (Netflix, Spotify, etc.)
4. NO deberías ver compras a cuotas aquí

**Si ves compras a cuotas en "Suscripciones":**
- Ve a Google Sheets y cambia el campo `tipo` a `deuda`

### Test 3: Panel de Depuración sin Alertas

1. Abre el **Panel de Depuración**
2. Verifica:
   ```
   Sin campo tipo:            0 ✓
   Sin monto_pagado_total:    0 ✓
   ```
3. El botón flotante debe ser **azul/verde**, no rojo

---

## 📊 Información del Panel de Depuración

### Qué Significa Cada Campo

**Deudas:**
- Número de compras a cuotas (campo `tipo: 'deuda'`)
- Incluye cualquier registro sin campo `tipo`

**Suscripciones:**
- Número de suscripciones mensuales (campo `tipo: 'suscripcion'`)

**Sin campo tipo:**
- Registros que NO tienen el campo `tipo` definido
- **⚠️ Problema:** Se mostrarán en "Deudas" por defecto
- **Solución:** Actualizar en Google Sheets

**Sin monto_pagado_total:**
- Registros que NO tienen el campo `monto_pagado_total`
- **⚠️ Problema:** Pagos parciales no se calcularán correctamente
- **Solución:** Ejecutar script de inicialización

**LocalStorage:**
- Muestra qué versión de la app tienes cargada
- Muestra cuántos registros tiene en caché

---

## 🔄 Workflow Recomendado

### Cuando Actualices la App

1. Incrementa versión en `package.json` y `useVersionCheck.ts`
2. Haz deploy
3. Los usuarios verán **auto-actualización**
4. El caché se limpiará automáticamente
5. **Opcional:** Pide a usuarios usar "Limpiar y Re-sincronizar" si reportan problemas

### Cuando Edites Datos en Google Sheets

1. Edita en Google Sheets
2. Guarda
3. Abre la app
4. Click en **"Forzar Sincronización"**
5. Los cambios se reflejarán inmediatamente

### Cuando Cambies de Navegador/Dispositivo

1. Abre la app en el nuevo dispositivo
2. Ingresa URL de Google Sheets y PIN
3. Click en **"Sincronizar"**
4. Si ves datos incorrectos → **"Limpiar y Re-sincronizar"**

---

## 🚨 Problemas Comunes

### "El panel dice 'Sin campo tipo: 5' pero no veo el problema"

**Solución:**
1. Ve a Google Sheets → `Gastos_Pendientes`
2. Filtra la columna M (`tipo`)
3. Busca celdas vacías
4. Rellénalas con `deuda` o `suscripcion`

### "Después de limpiar caché, las deudas desaparecieron"

**Causa:** Google Sheets no tiene los datos

**Solución:**
1. Verifica en Google Sheets que los datos existan
2. Verifica que la URL y PIN sean correctos
3. Intenta sincronizar de nuevo

### "El botón de debug no aparece"

**Causa:** No estás conectado a Google Sheets

**Solución:**
1. Ingresa URL de Google Sheets
2. Ingresa PIN
3. Haz clic en "Sincronizar"
4. El botón debería aparecer

### "Limpiar caché no funciona, sigue mostrando datos viejos"

**Solución Nuclear:**
1. En DevTools (F12) → Application → Storage → Clear site data
2. Recarga la página (Ctrl+Shift+R)
3. Ingresa URL y PIN de nuevo
4. Sincroniza

---

## 📝 Notas Técnicas

### localStorage vs Google Sheets

```
localStorage (Caché Local)
├─ Rápido (offline)
├─ Por navegador
├─ Puede estar desactualizado
└─ Se limpia automáticamente en nuevas versiones

Google Sheets (Fuente de Verdad)
├─ Siempre actualizado
├─ Compartido entre dispositivos
├─ Requiere conexión
└─ Se sincroniza con "Forzar Sincronización"
```

### Flujo de Sincronización

```
1. App carga
   ↓
2. Lee localStorage (datos rápidos, posiblemente viejos)
   ↓
3. Usuario click "Sincronizar"
   ↓
4. Fetch desde Google Sheets API
   ↓
5. Actualiza localStorage
   ↓
6. Re-renderiza UI con datos nuevos
```

### Por Qué Diferentes Navegadores Muestran Diferentes Datos

- Cada navegador tiene su propio `localStorage`
- Chrome no comparte datos con Edge
- Desktop no comparte datos con Mobile
- Solución: Forzar sincronización en cada dispositivo

---

## ✅ Checklist de Solución Completa

- [ ] Agregar columna L (`monto_pagado_total`) en Google Sheets
- [ ] Ejecutar script de inicialización (una vez)
- [ ] Verificar columna M (`tipo`) tiene valores correctos
- [ ] Actualizar Google Apps Script a v5.0
- [ ] Deploy de la app con versión 5.0.1+
- [ ] Abrir app en Chrome → Limpiar y Re-sincronizar
- [ ] Abrir app en Edge → Limpiar y Re-sincronizar
- [ ] Abrir app en Celular → Limpiar y Re-sincronizar
- [ ] Verificar que panel de debug no muestre alertas rojas
- [ ] Verificar que suscripciones estén en pestaña correcta

¡Después de esto, todos tus dispositivos mostrarán los mismos datos! 🎉

---

## 💡 Prevención Futura

1. **Siempre incrementa la versión** antes de desplegar cambios importantes
2. **Usa "Forzar Sincronización"** después de editar en Google Sheets
3. **Verifica el campo `tipo`** al crear nuevas deudas/suscripciones
4. **Revisa el panel de debug** periódicamente para detectar problemas

---

¿Necesitas más ayuda? Revisa `INSTRUCCIONES_IMPLEMENTACION.md` y `GESTION_VERSIONES.md`.
