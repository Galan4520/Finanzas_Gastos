# 📦 Gestión de Versiones y Caché

## Problema Solucionado

**Antes:**
- Chrome muestra una versión diferente que Edge
- Los usuarios ven código antiguo después de actualizar
- localStorage guarda datos incompatibles entre versiones
- Necesitas hacer Ctrl+F5 (hard reload) manualmente

**Después:**
- Detección automática de nuevas versiones
- Limpieza automática de caché al actualizar
- Recarga automática cuando hay cambios
- Sincronización perfecta entre navegadores

---

## 🔧 Cómo Funciona

### Sistema de Versiones

Cuando despliegas una nueva versión:

1. **Detección:** El hook `useVersionCheck` compara la versión actual con la guardada en localStorage
2. **Notificación:** Si detecta cambio, muestra un mensaje en consola
3. **Limpieza:** Borra localStorage (excepto configuraciones importantes)
4. **Recarga:** Fuerza un hard reload del navegador
5. **Actualización:** Guarda la nueva versión

### Cache Busting

Vite genera automáticamente hashes únicos para cada archivo:

```
Antes:  main.js
Después: main.a8f3b2c1.js
```

Cada vez que haces un build, los hashes cambian, forzando al navegador a descargar los archivos nuevos.

---

## 📝 Cómo Actualizar la Versión

### Paso 1: Actualizar package.json

Edita `package.json` e incrementa la versión usando [Semantic Versioning](https://semver.org/):

```json
{
  "version": "5.0.1"  // ← Cambiar aquí
}
```

**Reglas de versionado:**

- **MAJOR** (5.x.x): Cambios incompatibles, breaking changes
  - Ejemplo: Cambios en estructura de datos que requieren migración

- **MINOR** (x.0.x): Nuevas funcionalidades compatibles
  - Ejemplo: Nueva función de pagos parciales

- **PATCH** (x.x.1): Correcciones de bugs
  - Ejemplo: Fix de cálculo de deudas

**Ejemplos:**

```
5.0.0 → 5.0.1  (Bug fix)
5.0.1 → 5.1.0  (Nueva feature)
5.1.0 → 6.0.0  (Breaking change)
```

### Paso 2: Actualizar useVersionCheck.ts

Edita `hooks/useVersionCheck.ts` y actualiza la constante:

```typescript
const APP_VERSION = '5.0.1'; // ← Cambiar aquí
```

**⚠️ IMPORTANTE:** Ambas versiones deben ser idénticas.

### Paso 3: Build y Deploy

```bash
npm run build
# Desplegar a producción (Vercel/Netlify hará esto automáticamente)
```

---

## 🎯 Cuándo Incrementar la Versión

### ✅ SÍ incrementar versión:

- Cambios en el código que afectan funcionalidad
- Nuevas features
- Correcciones de bugs
- Cambios en tipos/interfaces (TypeScript)
- Cambios en estructura de localStorage

### ❌ NO incrementar versión:

- Cambios solo en estilos CSS
- Cambios en comentarios o documentación
- Cambios en archivos de configuración (vite.config, etc.)
- Cambios en README o archivos .md

---

## 🧪 Cómo Probar

### Test Manual

1. **Primera carga:**
   ```
   1. Abre la app en Chrome
   2. Abre DevTools (F12) → Console
   3. Busca: "🆕 Primera ejecución de la app - Versión: 5.0.1"
   ```

2. **Actualización:**
   ```
   1. Incrementa versión a 5.0.2
   2. Haz build y deploy
   3. Abre la app nuevamente
   4. Busca en console:
      - "🔄 Nueva versión detectada"
      - "🧹 Limpiando caché del navegador..."
      - "🔄 Recargando página..."
   5. La página debe recargar automáticamente
   ```

3. **Sincronización entre navegadores:**
   ```
   1. Abre la app en Chrome (versión 5.0.1)
   2. Actualiza a 5.0.2 y despliega
   3. Abre en Edge (debería detectar 5.0.2 automáticamente)
   4. Recarga Chrome (debería actualizar a 5.0.2)
   ```

### Verificar Cache Busting

Después de hacer build:

```bash
npm run build
ls -la dist/assets/
```

Deberías ver archivos con hashes:
```
index.a8f3b2c1.js
main.d4e5f6a7.js
vendor.1a2b3c4d.js
```

---

## 🔍 Debugging

### Ver versión actual en consola

```javascript
// En DevTools Console
localStorage.getItem('app_version')
```

### Forzar limpieza manual

```javascript
// En DevTools Console
localStorage.clear()
location.reload()
```

### Deshabilitar temporalmente el auto-update

Edita `hooks/useVersionCheck.ts`:

```typescript
// Comentar esta línea para deshabilitar auto-reload
// window.location.reload();
```

---

## 📂 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Versión principal del proyecto |
| `hooks/useVersionCheck.ts` | Lógica de detección y limpieza |
| `vite.config.ts` | Configuración de cache busting |
| `App.tsx` | Integración del hook de versión |

---

## 🚨 Solución de Problemas

### Problema: "La versión no se actualiza"

**Solución:**
1. Verifica que `package.json` y `useVersionCheck.ts` tengan la misma versión
2. Haz hard reload: Ctrl+Shift+R (Windows/Linux) o Cmd+Shift+R (Mac)
3. Borra localStorage manualmente: DevTools → Application → Local Storage → Clear All

### Problema: "Se borra mi configuración al actualizar"

**Solución:**
Edita `hooks/useVersionCheck.ts` y agrega tus keys a `preserveKeys`:

```typescript
const preserveKeys: string[] = [
  'theme',              // Preservar tema
  'user_preferences',   // Preservar preferencias
  'scriptUrl',          // Preservar URL de Google Sheets
  'pin'                 // Preservar PIN
];
```

### Problema: "Loop infinito de recargas"

**Solución:**
1. Verifica que la versión en `package.json` y `useVersionCheck.ts` sea exactamente igual
2. Si el problema persiste, borra localStorage manualmente

---

## 🎯 Mejores Prácticas

1. **Siempre incrementa la versión antes de desplegar**
2. **Usa PATCH para pequeños cambios, MINOR para features, MAJOR para breaking changes**
3. **Prueba la actualización en local antes de desplegar**
4. **Documenta cambios importantes en un CHANGELOG**
5. **No cambies la versión en development, solo antes de desplegar a producción**

---

## 📊 Ejemplo de Workflow

```bash
# 1. Desarrollo
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
npm run dev # Test local

# 2. Antes de merge a main
# Incrementar versión en package.json: 5.0.1 → 5.1.0
# Actualizar hooks/useVersionCheck.ts: 5.1.0
git add .
git commit -m "feat: Nueva funcionalidad v5.1.0"
git push

# 3. Deploy automático (Vercel/Netlify)
# - Build con cache busting
# - Deploy a producción
# - Usuarios reciben auto-update

# 4. Verificación
# - Abrir app en navegador
# - Verificar en console: "Versión actual: 5.1.0"
# - Confirmar que nueva funcionalidad está disponible
```

---

## 🔗 Referencias

- [Semantic Versioning](https://semver.org/)
- [Vite - Build Optimizations](https://vitejs.dev/guide/build.html)
- [MDN - Cache Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
