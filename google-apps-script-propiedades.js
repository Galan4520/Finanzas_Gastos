/**
 * Google Apps Script para Catálogo de Propiedades Inmobiliarias
 * Este script es INDEPENDIENTE del script de finanzas principal.
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet de propiedades
 * 2. Ve a Extensiones > Apps Script
 * 3. Borra el código por defecto y pega este código
 * 4. Guarda el proyecto con un nombre (ej: "Propiedades API")
 * 5. Ve a Implementar > Nueva implementación
 * 6. Tipo: Aplicación web
 * 7. Ejecutar como: Yo
 * 8. Quién tiene acceso: Cualquier persona
 * 9. Copia la URL de la implementación
 * 10. Usa esa URL en tu aplicación frontend
 *
 * ESTRUCTURA DE LA HOJA "Propiedades_Disponibles":
 * Columna A: titulo
 * Columna B: tipo (Casa, Departamento, Terreno, Local Comercial, Otro)
 * Columna C: zona (ej: San Isidro, Miraflores, etc.)
 * Columna D: precio (número)
 * Columna E: area_m2 (número, opcional)
 * Columna F: dormitorios (número, opcional)
 * Columna G: banos (número, opcional)
 * Columna H: descripcion (texto, opcional)
 * Columna I: url_imagen (URL, opcional)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const propiedadesSheet = sheet.getSheetByName('Propiedades_Disponibles');

    if (!propiedadesSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'No se encontró la hoja "Propiedades_Disponibles"'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Leer todas las filas (saltando el encabezado)
    const data = propiedadesSheet.getDataRange().getValues();
    const properties = [];

    // Mapeo de columnas basado en tu estructura:
    // A(0): ID
    // B(1): URL
    // C(2): Fotos
    // D(3): Portal
    // E(4): Fecha Extracción
    // F(5): Fecha Publicación
    // G(6): Título
    // H(7): Descripción
    // I(8): Es Unidad de Proyecto
    // J(9): URL Proyecto Padre
    // K(10): Distrito
    // L(11): Dirección
    // M(12): Urbanización
    // N(13): Referencia
    // O(14): Latitud
    // P(15): Longitud
    // Q(16): Área Total (m²)
    // R(17): Área Construida (m²)
    // S(18): Área Techada (m²)
    // T(19): Dormitorios
    // U(20): Baños
    // V(21): Medio Baño
    // ... continúa hasta las demás columnas
    // AE(30): Precio (S/)
    // AM(38): Tipo

    // Empezar desde la fila 2 (índice 1) para saltar encabezados
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Solo agregar si tiene ID o Título
      if ((row[0] && row[0].toString().trim() !== '') || (row[6] && row[6].toString().trim() !== '')) {
        const property = {
          id: row[0] ? row[0].toString().trim() : 'PROP' + i.toString().padStart(4, '0'),
          titulo: row[6] ? row[6].toString().trim() : 'Propiedad sin título',
          tipo: row[38] ? mapearTipo(row[38].toString().trim()) : 'Otro',
          zona: row[10] ? row[10].toString().trim() : '',
          precio: parseFloat(row[30]) || 0,
          area_m2: parseFloat(row[16]) || parseFloat(row[17]) || null, // Área Total o Área Construida
          dormitorios: row[19] ? parseInt(row[19]) : null,
          banos: row[20] ? parseFloat(row[20]) : null,
          descripcion: row[7] ? row[7].toString().trim() : '',
          url_imagen: row[2] ? extraerPrimeraFoto(row[2].toString()) : '', // Columna Fotos
          url_propiedad: row[1] ? row[1].toString().trim() : '',
          distrito: row[10] ? row[10].toString().trim() : '',
          direccion: row[11] ? row[11].toString().trim() : '',
          precio_m2: parseFloat(row[32]) || null,
          timestamp: new Date().toISOString()
        };

        properties.push(property);
      }
    }

    // Retornar JSON
    const response = {
      success: true,
      properties: properties,
      total: properties.length,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      success: false
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mapea el tipo de propiedad del portal a los tipos de la app
 */
function mapearTipo(tipo) {
  if (!tipo) return 'Otro';

  const tipoLower = tipo.toLowerCase();

  if (tipoLower.includes('casa')) return 'Casa';
  if (tipoLower.includes('departamento') || tipoLower.includes('depa')) return 'Departamento';
  if (tipoLower.includes('terreno') || tipoLower.includes('lote')) return 'Terreno';
  if (tipoLower.includes('local') || tipoLower.includes('comercial') || tipoLower.includes('oficina')) return 'Local Comercial';

  return 'Otro';
}

/**
 * Extrae la primera foto de una lista separada por comas o espacios
 */
function extraerPrimeraFoto(fotos) {
  if (!fotos) return '';

  const fotosTrim = fotos.toString().trim();
  if (fotosTrim === '') return '';

  // Si hay múltiples URLs separadas por coma, tomar la primera
  if (fotosTrim.includes(',')) {
    return fotosTrim.split(',')[0].trim();
  }

  // Si hay múltiples URLs separadas por espacio, tomar la primera
  if (fotosTrim.includes(' ')) {
    return fotosTrim.split(' ')[0].trim();
  }

  return fotosTrim;
}

/**
 * Función para agregar una nueva propiedad (opcional - para futuro)
 */
function doPost(e) {
  try {
    const params = e.parameter;

    // Si quieres agregar funcionalidad para crear/actualizar/eliminar propiedades
    // desde el frontend, puedes implementarlo aquí

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'POST no implementado aún'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      success: false
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
