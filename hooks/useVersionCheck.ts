import { useEffect, useState } from 'react';

const APP_VERSION = '5.0.1'; // Sincronizado con package.json
const VERSION_KEY = 'app_version';

/**
 * Hook para detectar cambios de versión y limpiar caché automáticamente
 *
 * Soluciona el problema de:
 * - Diferentes versiones en Chrome vs Edge
 * - Caché del navegador mostrando código antiguo
 * - localStorage con datos incompatibles
 *
 * Uso:
 * const { isNewVersion, clearCache } = useVersionCheck();
 */
export const useVersionCheck = () => {
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (hasChecked) return;

    const storedVersion = localStorage.getItem(VERSION_KEY);

    // Primera vez que se ejecuta la app
    if (!storedVersion) {
      console.log('🆕 Primera ejecución de la app - Versión:', APP_VERSION);
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      setHasChecked(true);
      return;
    }

    // Detectar cambio de versión
    if (storedVersion !== APP_VERSION) {
      console.log('🔄 Nueva versión detectada');
      console.log('  - Versión anterior:', storedVersion);
      console.log('  - Versión actual:', APP_VERSION);

      setIsNewVersion(true);

      // Auto-limpiar caché después de 1 segundo para que el usuario vea el mensaje
      setTimeout(() => {
        clearCache();
      }, 1000);
    } else {
      console.log('✅ Versión actual:', APP_VERSION);
    }

    setHasChecked(true);
  }, [hasChecked]);

  const clearCache = () => {
    console.log('🧹 Limpiando caché del navegador...');

    // Lista de keys que queremos preservar (si hay alguna)
    const preserveKeys: string[] = [
      // Agrega aquí las keys que NO quieres borrar
      // Ejemplo: 'user_preferences', 'theme'
    ];

    // Obtener todas las keys del localStorage
    const allKeys = Object.keys(localStorage);

    // Borrar todo excepto las keys preservadas
    allKeys.forEach(key => {
      if (!preserveKeys.includes(key)) {
        localStorage.removeItem(key);
        console.log('  - Borrado:', key);
      }
    });

    // Guardar nueva versión
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    console.log('✅ Caché limpiado - Versión actualizada a:', APP_VERSION);

    // Forzar recarga completa (hard reload)
    console.log('🔄 Recargando página...');
    window.location.reload();
  };

  const forceUpdate = () => {
    console.log('⚡ Forzando actualización manual...');
    clearCache();
  };

  return {
    currentVersion: APP_VERSION,
    isNewVersion,
    clearCache,
    forceUpdate
  };
};
