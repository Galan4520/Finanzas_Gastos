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

    // Empezar desde la fila 2 (índice 1) para saltar encabezados
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Solo agregar si tiene título (columna A)
      if (row[0] && row[0].toString().trim() !== '') {
        const property = {
          id: 'PROP' + (i).toString().padStart(4, '0'), // Genera ID único
          titulo: row[0].toString().trim(),
          tipo: row[1] ? row[1].toString().trim() : 'Otro',
          zona: row[2] ? row[2].toString().trim() : '',
          precio: parseFloat(row[3]) || 0,
          area_m2: row[4] ? parseFloat(row[4]) : null,
          dormitorios: row[5] ? parseInt(row[5]) : null,
          banos: row[6] ? parseFloat(row[6]) : null,
          descripcion: row[7] ? row[7].toString().trim() : '',
          url_imagen: row[8] ? row[8].toString().trim() : '',
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
