/**
 * Configuración pública de la aplicación
 *
 * IMPORTANTE: Este archivo contiene URLs públicas compartidas por todos los usuarios.
 * Cada usuario solo necesita configurar su propio Google Sheet de finanzas personal.
 */

// URL PÚBLICA del catálogo de propiedades inmobiliarias
// Esta URL es compartida por TODOS los usuarios de la aplicación
// Solo el administrador del catálogo debe actualizar esta URL
export const PUBLIC_PROPERTIES_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQksoQzJ7V3Iy7zGfZEwMBzxkYcTKdSdqSMgC_MG-TljCS4f-yeqQhWMf_g31jP0162A/exec';

/**
 * INSTRUCCIONES PARA EL ADMINISTRADOR DEL CATÁLOGO:
 *
 * 1. Crea un Google Sheet público para el catálogo de propiedades
 * 2. Usa el script de google-apps-script-propiedades.js
 * 3. Despliega como Web App (acceso: Cualquier persona)
 * 4. Copia la URL que termina en /exec
 * 5. Pégala arriba en PUBLIC_PROPERTIES_SCRIPT_URL
 * 6. Haz commit del cambio a Git
 *
 * Ejemplo:
 * export const PUBLIC_PROPERTIES_SCRIPT_URL = 'https://script.google.com/macros/s/ABC123.../exec';
 *
 * NOTA: Los usuarios finales NO necesitan configurar esta URL.
 * Verán automáticamente el catálogo público de propiedades.
 */
