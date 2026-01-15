# Configuración del Catálogo de Propiedades Inmobiliarias

Este documento explica cómo configurar un Google Sheet separado para el catálogo de propiedades inmobiliarias.

## 📋 Opción 1: Usar el Script Principal (Más Simple)

Si no quieres configurar un Google Sheet separado, puedes agregar una hoja llamada `Propiedades_Disponibles` a tu Google Sheet principal de finanzas. El script principal (`google-apps-script-updated.js`) ya está configurado para leer esta hoja.

**Estructura de columnas:**
```
A: titulo
B: tipo (Casa, Departamento, Terreno, Local Comercial, Otro)
C: zona (ej: San Isidro, Miraflores, etc.)
D: precio (número)
E: area_m2 (número, opcional)
F: dormitorios (número, opcional)
G: banos (número, opcional)
H: descripcion (texto, opcional)
I: url_imagen (URL, opcional)
```

## 📋 Opción 2: Google Sheet Separado (Recomendado)

### Paso 1: Crear Google Sheet de Propiedades

1. Crea un nuevo Google Sheet
2. Nombra la primera hoja: **Propiedades_Disponibles**
3. Agrega los siguientes encabezados en la fila 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| titulo | tipo | zona | precio | area_m2 | dormitorios | banos | descripcion | url_imagen |

### Paso 2: Agregar Datos de Ejemplo

```
titulo: Departamento Moderno en San Isidro
tipo: Departamento
zona: San Isidro
precio: 280000
area_m2: 85
dormitorios: 2
banos: 2
descripcion: Moderno departamento en zona residencial
url_imagen: (opcional - URL de imagen)
```

### Paso 3: Instalar el Script

1. En tu Google Sheet de propiedades, ve a **Extensiones > Apps Script**
2. Borra el código por defecto (`function myFunction() {}`)
3. Pega el contenido del archivo `google-apps-script-propiedades.js`
4. Guarda el proyecto con un nombre (ej: "API Propiedades")

### Paso 4: Implementar como Web App

1. En Apps Script, haz clic en **Implementar > Nueva implementación**
2. Tipo: Selecciona **Aplicación web**
3. Descripción: "API de Propiedades v1"
4. Ejecutar como: **Yo (tu correo)**
5. Quién tiene acceso: **Cualquier persona**
6. Haz clic en **Implementar**
7. **Copia la URL de la implementación** (termina en `/exec`)

### Paso 5: Configurar en la Aplicación

1. Abre tu aplicación de finanzas
2. Ve a la pestaña **Configuración**
3. En la sección **"URL de Propiedades (Opcional)"**, pega la URL que copiaste
4. Haz clic en el botón de guardar (💾)
5. Sincroniza la aplicación

### Paso 6: Verificar

1. Ve a la pestaña **Activos**
2. Selecciona el subtab **Explorar**
3. Deberías ver las propiedades de tu Google Sheet

## 🔍 Tipos de Propiedad Válidos

- **Casa**
- **Departamento**
- **Terreno**
- **Local Comercial**
- **Otro**

## 📝 Ejemplo de Datos Completos

| titulo | tipo | zona | precio | area_m2 | dormitorios | banos | descripcion | url_imagen |
|--------|------|------|--------|---------|-------------|-------|-------------|------------|
| Casa con Jardín en Surco | Casa | Santiago de Surco | 450000 | 180 | 4 | 3 | Amplia casa con jardín y cochera | |
| Loft en Miraflores | Departamento | Miraflores | 320000 | 65 | 1 | 1 | Moderno loft cerca al malecón | |
| Terreno en Pachacamac | Terreno | Pachacamac | 120000 | 500 | | | Terreno plano ideal para proyecto | |

## 🔧 Solución de Problemas

### No veo las propiedades

1. Verifica que el nombre de la hoja sea exactamente: **Propiedades_Disponibles**
2. Verifica que la URL termine en `/exec`
3. Verifica que el script esté implementado como "Aplicación web"
4. Verifica que "Quién tiene acceso" esté en "Cualquier persona"

### Error al sincronizar

1. Abre la URL del script directamente en el navegador
2. Deberías ver un JSON con `{"success": true, "properties": [...]}`
3. Si ves un error de permisos, re-implementa el script

### Actualizar el Script

Si haces cambios en el script:

1. Ve a **Implementar > Administrar implementaciones**
2. Haz clic en el ícono de lápiz (editar)
3. En "Nueva versión", selecciona **Nueva versión**
4. Haz clic en **Implementar**

## 💡 Consejos

- **No borres la fila 1** (encabezados)
- **Los campos opcionales** (area_m2, dormitorios, banos, descripcion, url_imagen) pueden dejarse vacíos
- **El campo precio** debe ser un número sin símbolos (ej: 280000, no S/ 280,000)
- **Agrega todas las propiedades** que quieras, no hay límite
- **Actualiza cuando quieras**, la app sincronizará automáticamente

## 📱 Uso en la Aplicación

Una vez configurado:

1. **Explorar**: Busca propiedades disponibles con filtros por zona, tipo y precio
2. **Mis Propiedades**: Agrega propiedades que ya compraste a tu portafolio
3. **Dashboard**: Ve el resumen de tus inversiones inmobiliarias

---

¿Tienes problemas? Verifica que:
- ✅ La hoja se llama exactamente "Propiedades_Disponibles"
- ✅ Los encabezados están en la fila 1
- ✅ El script está implementado como "Aplicación web"
- ✅ "Quién tiene acceso" = "Cualquier persona"
- ✅ Copiaste la URL que termina en `/exec`
