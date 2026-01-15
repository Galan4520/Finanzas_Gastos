# Configuración del Catálogo de Propiedades Inmobiliarias (PÚBLICO)

Este documento explica cómo configurar un Google Sheet **público** para el catálogo de propiedades inmobiliarias que será compartido por todos los usuarios de la aplicación.

## 🌐 Concepto Importante

- **Catálogo de Propiedades**: Es PÚBLICO y compartido por TODOS los usuarios
- **Google Sheet de Finanzas**: Es PRIVADO, cada usuario tiene el suyo
- **Resultado**: Todos ven el mismo catálogo de propiedades, pero cada uno gestiona sus propias finanzas

## 👤 Roles

### Administrador del Catálogo (TÚ)
- Mantienes el Google Sheet público de propiedades
- Actualizas el catálogo cuando hay nuevas propiedades
- Configuras la URL pública en el código

### Usuarios Finales
- Solo configuran su Google Sheet personal de finanzas
- Ven automáticamente tu catálogo público de propiedades
- NO necesitan configurar nada relacionado a propiedades

---

## 📋 Paso 1: Crear Google Sheet Público de Propiedades

1. Crea un nuevo Google Sheet
2. Nombra la primera hoja: **Propiedades_Disponibles**
3. Agrega los siguientes encabezados en la fila 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| titulo | tipo | zona | precio | area_m2 | dormitorios | banos | descripcion | url_imagen |

### Tipos de Propiedad Válidos
- **Casa**
- **Departamento**
- **Terreno**
- **Local Comercial**
- **Otro**

### Ejemplo de Datos

| titulo | tipo | zona | precio | area_m2 | dormitorios | banos | descripcion | url_imagen |
|--------|------|------|--------|---------|-------------|-------|-------------|------------|
| Casa con Jardín en Surco | Casa | Santiago de Surco | 450000 | 180 | 4 | 3 | Amplia casa con jardín y cochera | |
| Loft en Miraflores | Departamento | Miraflores | 320000 | 65 | 1 | 1 | Moderno loft cerca al malecón | |
| Terreno en Pachacamac | Terreno | Pachacamac | 120000 | 500 | | | Terreno plano ideal para proyecto | |

---

## 📋 Paso 2: Instalar el Script

1. En tu Google Sheet de propiedades, ve a **Extensiones > Apps Script**
2. Borra el código por defecto (`function myFunction() {}`)
3. Pega el contenido del archivo **`google-apps-script-propiedades.js`**
4. Guarda el proyecto con un nombre (ej: "API Pública de Propiedades")

---

## 📋 Paso 3: Implementar como Web App PÚBLICA

1. En Apps Script, haz clic en **Implementar > Nueva implementación**
2. Tipo: Selecciona **Aplicación web**
3. Descripción: "Catálogo Público de Propiedades v1"
4. **Ejecutar como**: **Yo** (tu correo)
5. **Quién tiene acceso**: **Cualquier persona** ⚠️ IMPORTANTE
6. Haz clic en **Implementar**
7. **Copia la URL de la implementación** (termina en `/exec`)

Ejemplo de URL:
```
https://script.google.com/macros/s/AKfycby...ABC123.../exec
```

---

## 📋 Paso 4: Configurar la URL en el Código

1. Abre el archivo **`config.ts`** en la raíz del proyecto
2. Pega tu URL en la constante `PUBLIC_PROPERTIES_SCRIPT_URL`:

```typescript
export const PUBLIC_PROPERTIES_SCRIPT_URL = 'https://script.google.com/macros/s/ABC123.../exec';
```

3. Guarda el archivo
4. Haz commit y push a Git:

```bash
git add config.ts
git commit -m "feat: Configure public properties catalog URL"
git push
```

---

## 📋 Paso 5: Verificar

### Como Administrador:
1. Abre tu aplicación de finanzas
2. Conéctate con tu Google Sheet personal
3. Ve a la pestaña **Activos > Explorar**
4. Deberías ver las propiedades de tu catálogo público

### Como Usuario Final:
1. Los usuarios solo conectan su Google Sheet de finanzas
2. Automáticamente verán tu catálogo público
3. NO necesitan hacer nada relacionado a propiedades

---

## 🔄 Actualizar Propiedades

Para agregar o modificar propiedades:

1. Edita tu Google Sheet de propiedades
2. Agrega/modifica filas (no borres la fila 1 de encabezados)
3. Los usuarios verán los cambios en la próxima sincronización

**NO necesitas**:
- ❌ Actualizar el código
- ❌ Hacer nuevo deploy del script
- ❌ Notificar a los usuarios

---

## 🔧 Solución de Problemas

### Los usuarios no ven propiedades

**Verifica que:**
1. ✅ El nombre de la hoja sea exactamente: **Propiedades_Disponibles**
2. ✅ La URL esté configurada en **`config.ts`**
3. ✅ El script esté implementado como **"Aplicación web"**
4. ✅ **"Quién tiene acceso"** = **"Cualquier persona"**
5. ✅ La URL termine en `/exec`

### Error 403 o "No autorizado"

Esto significa que el script NO está configurado como público:
1. Ve a **Implementar > Administrar implementaciones**
2. Edita la implementación
3. Asegúrate que **"Quién tiene acceso"** = **"Cualquier persona"**
4. Guarda

### Actualizar el Script

Si haces cambios en el código del script:

1. Ve a **Implementar > Administrar implementaciones**
2. Haz clic en el ícono de lápiz (editar)
3. En "Nueva versión", selecciona **Nueva versión**
4. Haz clic en **Implementar**
5. **La URL NO cambia**, no necesitas actualizar `config.ts`

---

## 💡 Preguntas Frecuentes

### ¿Los usuarios pueden editar el catálogo?
No, el catálogo es de solo lectura. Solo tú (como administrador) puedes editar el Google Sheet de propiedades.

### ¿Puedo tener múltiples catálogos?
Sí, pero necesitarías modificar el código para soportar múltiples URLs o permitir que los usuarios seleccionen el catálogo.

### ¿Los datos son seguros?
El catálogo es público por diseño. No pongas información sensible. Los datos financieros personales de cada usuario están en su propio Google Sheet privado.

### ¿Cuántas propiedades puedo tener?
No hay límite práctico. Google Sheets soporta hasta 10 millones de celdas.

### ¿Se actualizan en tiempo real?
Los usuarios verán las actualizaciones la próxima vez que sincronicen su aplicación (botón de sincronizar o al recargar).

---

## 📱 Uso en la Aplicación (Usuario Final)

Los usuarios solo necesitan:

1. **Configurar su Google Sheet de finanzas personal** (con sus tarjetas, gastos, etc.)
2. Ir a **Activos > Explorar** para ver el catálogo público de propiedades
3. Filtrar por zona, tipo y precio
4. Agregar propiedades a "Mis Propiedades" si las compran

---

## 🎯 Resumen

| Concepto | Descripción |
|----------|-------------|
| **Catálogo de Propiedades** | Público, compartido por todos, gestionado por ti |
| **Google Sheet de Finanzas** | Privado, uno por usuario |
| **Configuración del Usuario** | Solo su Google Sheet personal |
| **Tu responsabilidad** | Mantener el catálogo actualizado |

¿Listo? ¡Configura la URL en `config.ts` y haz push! 🚀
