# Archivo de Configuración (config.ts)

## ¿Qué es config.ts?

`config.ts` contiene la **URL pública** del catálogo de propiedades inmobiliarias que es compartido por todos los usuarios de la aplicación.

## ⚠️ IMPORTANTE

- **Esta URL es PÚBLICA** - Todos los usuarios verán el mismo catálogo
- **No pongas información sensible aquí** - Es accesible para cualquier persona
- **Solo el administrador debe configurar esto** - Los usuarios finales no tocan este archivo

## 📝 Configuración

1. Despliega tu Google Sheet de propiedades como Web App pública
2. Copia la URL que termina en `/exec`
3. Pégala en `config.ts`:

```typescript
export const PUBLIC_PROPERTIES_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';
```

4. Haz commit y push

## 🔗 Referencia

Para instrucciones completas, consulta: [PROPIEDADES_SETUP.md](./PROPIEDADES_SETUP.md)

## 🤔 ¿Y si no quiero un catálogo público?

Si no quieres usar el catálogo de propiedades, simplemente deja la URL vacía:

```typescript
export const PUBLIC_PROPERTIES_SCRIPT_URL = '';
```

La aplicación funcionará normalmente, solo no habrá propiedades en la sección "Activos > Explorar".
