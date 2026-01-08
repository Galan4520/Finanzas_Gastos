# 📊 Estructura de la Plantilla de Google Sheets

Este documento describe la estructura exacta que debe tener tu Google Sheet para funcionar con MoneyCrock.

## 🗂️ Hojas Necesarias

Tu Google Sheet debe tener las siguientes hojas (pestañas):

### 1. Config
**Propósito:** Almacenar el PIN de seguridad

| Columna A | Valor |
|-----------|-------|
| PIN       | (Tu PIN aquí) |

**Ejemplo:**
```
A1: PIN
A2: 1234
```

---

### 2. Tarjetas
**Propósito:** Almacenar información de tus tarjetas de crédito

| alias | banco | tipo | limite | cierre | pago | timestamp |
|-------|-------|------|--------|--------|------|-----------|

**Campos:**
- `alias`: Nombre corto de la tarjeta (ej: "Visa Gold")
- `banco`: Nombre del banco (ej: "BCP", "Interbank")
- `tipo`: Tipo de tarjeta (ej: "Visa", "Mastercard")
- `limite`: Límite de crédito en soles
- `cierre`: Día de cierre (1-31)
- `pago`: Día de pago (1-31)
- `timestamp`: Fecha/hora de creación (auto)

---

### 3. Gastos
**Propósito:** Registro de gastos en efectivo

| fecha | categoria | descripcion | monto | notas | timestamp |
|-------|-----------|-------------|-------|-------|-----------|

**Campos:**
- `fecha`: Fecha del gasto (YYYY-MM-DD)
- `categoria`: Categoría del gasto (ej: "🍔 Comida")
- `descripcion`: Descripción del gasto
- `monto`: Monto en soles
- `notas`: Notas adicionales (opcional)
- `timestamp`: Fecha/hora de registro (auto)

**Categorías sugeridas:**
- 🍔 Comida
- 🚗 Transporte
- 🏠 Hogar
- 👕 Ropa
- 🎮 Entretenimiento
- 💊 Salud
- 📚 Educación
- 🔥 Otros

---

### 4. Ingresos
**Propósito:** Registro de ingresos

| fecha | categoria | descripcion | monto | notas | timestamp |
|-------|-----------|-------------|-------|-------|-----------|

**Campos:**
- `fecha`: Fecha del ingreso (YYYY-MM-DD)
- `categoria`: Categoría del ingreso (ej: "💼 Salario")
- `descripcion`: Descripción del ingreso
- `monto`: Monto en soles
- `notas`: Notas adicionales (opcional)
- `timestamp`: Fecha/hora de registro (auto)

**Categorías sugeridas:**
- 💼 Salario
- 💰 Freelance
- 🎁 Regalo
- 💸 Inversiones
- 🔥 Otros

---

### 5. Gastos_Pendientes
**Propósito:** Registro de compras a cuotas y suscripciones

| id | fecha_gasto | tarjeta | categoria | descripcion | monto | fecha_cierre | fecha_pago | estado | num_cuotas | cuotas_pagadas | notas | timestamp | tipo |
|----|-------------|---------|-----------|-------------|-------|--------------|------------|--------|------------|----------------|-------|-----------|------|

**Campos:**
- `id`: ID único (auto-generado)
- `fecha_gasto`: Fecha de la compra
- `tarjeta`: Alias de la tarjeta usada
- `categoria`: Categoría del gasto
- `descripcion`: Descripción de la compra
- `monto`: Monto total (no por cuota)
- `fecha_cierre`: Fecha de cierre
- `fecha_pago`: Fecha de pago
- `estado`: "Pendiente" o "Pagado"
- `num_cuotas`: Número total de cuotas
- `cuotas_pagadas`: Cuotas ya pagadas
- `notas`: Notas adicionales
- `timestamp`: Fecha/hora de registro
- `tipo`: "deuda" o "suscripcion"

---

### 6. Pagos
**Propósito:** Registro de pagos de cuotas

| fecha_pago | id_gasto | tarjeta | descripcion_gasto | monto_pagado | tipo_pago | num_cuota | timestamp |
|------------|----------|---------|-------------------|--------------|-----------|-----------|-----------|

**Campos:**
- `fecha_pago`: Fecha del pago
- `id_gasto`: ID del gasto relacionado
- `tarjeta`: Tarjeta con la que se pagó
- `descripcion_gasto`: Descripción del gasto
- `monto_pagado`: Monto del pago
- `tipo_pago`: "Cuota", "Total", "Parcial"
- `num_cuota`: Número de cuota (si aplica)
- `timestamp`: Fecha/hora del pago

---

### 7. Meta_Ahorro
**Propósito:** Configuración de meta de ahorro anual

| meta_anual | ahorro_mensual_necesario | proposito | anio | timestamp |
|------------|-------------------------|-----------|------|-----------|

**Campos:**
- `meta_anual`: Monto de ahorro anual deseado
- `ahorro_mensual_necesario`: Ahorro mensual necesario (auto-calculado)
- `proposito`: Propósito del ahorro (ej: "Viaje a Europa")
- `anio`: Año de la meta
- `timestamp`: Fecha/hora de configuración

---

### 8. Perfil
**Propósito:** Información del perfil del usuario

| nombre | avatar_id | timestamp |
|--------|-----------|-----------|

**Campos:**
- `nombre`: Nombre del usuario
- `avatar_id`: ID del avatar seleccionado (1-8)
- `timestamp`: Fecha/hora de creación

**Avatares disponibles:**
1. 👨‍💼 Profesional
2. 👩‍💻 Tech
3. 🧑‍🎨 Creativo
4. 👨‍🏫 Académico
5. 👩‍⚕️ Salud
6. 🧑‍🔬 Ciencia
7. 👨‍🍳 Gastronomía
8. 👩‍✈️ Viajes

---

## 🎨 Formato Recomendado

### Encabezados
- **Fuente:** Arial o Google Sans
- **Tamaño:** 10-11pt
- **Estilo:** Negrita
- **Fondo:** Color claro (opcional)

### Datos
- **Fuente:** Arial o Google Sans
- **Tamaño:** 10pt
- **Formato de fechas:** YYYY-MM-DD o DD/MM/YYYY
- **Formato de montos:** Número con 2 decimales

---

## ✅ Validación

Para verificar que tu hoja está correctamente configurada:

1. ✅ Todas las 8 hojas están creadas
2. ✅ Los nombres de las hojas coinciden exactamente (sensible a mayúsculas)
3. ✅ Los encabezados están en la fila 1
4. ✅ Los nombres de columnas coinciden exactamente
5. ✅ La hoja Config tiene el PIN configurado
6. ✅ El script de Apps Script está desplegado

---

## 🔄 Actualizar Estructura

Si ya tienes una hoja antigua y quieres actualizar:

1. **NO borres las hojas existentes** (perderás datos)
2. Agrega las columnas faltantes al final de cada hoja
3. Las nuevas filas se crearán automáticamente con todos los campos

---

## 📝 Notas Importantes

- Los campos `timestamp` se llenan automáticamente
- El campo `id` en Gastos_Pendientes se genera automáticamente
- No es necesario llenar todas las columnas manualmente
- Puedes agregar columnas adicionales al final si las necesitas para análisis personal

---

## 🚨 Errores Comunes

### Error: "Hoja no encontrada"
- **Causa:** Nombre de hoja incorrecto
- **Solución:** Verifica que los nombres coincidan exactamente (ej: "Gastos_Pendientes" no "Gastos Pendientes")

### Error: "Columna no encontrada"
- **Causa:** Falta una columna o el nombre es incorrecto
- **Solución:** Verifica los encabezados en la fila 1

### Error: "PIN inválido"
- **Causa:** El PIN no coincide con el de la hoja Config
- **Solución:** Verifica la celda A2 de la hoja Config
