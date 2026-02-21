# 🚀 Guía Completa para Nuevos Usuarios — MoneyCrock

> **Tiempo estimado:** 15-20 minutos  
> **Requisitos:** Una cuenta de Google (Gmail)  
> **Resultado:** Tu app de finanzas funcionando con notificaciones y auto-actualización

---

## 📑 Índice

1. [Copiar la Plantilla de Google Sheets](#paso-1)
2. [Abrir Apps Script y pegar el código](#paso-2)
3. [Configurar el appsscript.json](#paso-3)
4. [Crear un Proyecto en Google Cloud](#paso-4)
5. [Activar la Apps Script API (Google Cloud)](#paso-5)
6. [Activar la Apps Script API (Configuración de Usuario)](#paso-6)
7. [Vincular el Proyecto GCP con Apps Script](#paso-7)
8. [Desplegar la Aplicación Web](#paso-8)
9. [Autorizar Todos los Permisos](#paso-9)
10. [Conectar la App con tu Script](#paso-10)
11. [Configurar Notificaciones por Email](#paso-11)
12. [Verificar el Auto-Update del GAS](#paso-12)
13. [Verificación Final](#paso-13)

---

<a id="paso-1"></a>
## 📋 Paso 1: Copiar la Plantilla de Google Sheets

1. Abre este enlace: **[📋 Copiar Plantilla](https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy)**
2. Google te pedirá hacer una copia automáticamente
3. Dale un nombre (ej: **"Mis Finanzas 2026"**)
4. Click en **"Hacer una copia"**

> [!TIP]
> La plantilla ya incluye todas las hojas necesarias: Config, Tarjetas, Gastos, Ingresos, Gastos_Pendientes, Pagos, Metas y Perfil.

---

<a id="paso-2"></a>
## 💻 Paso 2: Abrir Apps Script y Pegar el Código

1. En tu copia de Google Sheets, ve a **Extensiones → Apps Script**
2. Se abrirá el editor de Apps Script
3. **Borra todo** el código que aparece por defecto
4. Abre el archivo del código fuente: **[google-apps-script-NUEVO.js en GitHub](https://raw.githubusercontent.com/Galan4520/Finanzas_Gastos/main/google-apps-script-NUEVO.js)**
5. **Copia todo** el contenido (Ctrl+A → Ctrl+C)
6. **Pega** en el editor de Apps Script (Ctrl+V)
7. Guarda con **Ctrl+S**

> [!IMPORTANT]
> Asegúrate de copiar TODO el código. El archivo es largo (~1700 líneas).

---

<a id="paso-3"></a>
## ⚙️ Paso 3: Configurar el appsscript.json

1. En el editor de Apps Script, haz clic en **⚙️ Configuración del proyecto** (barra lateral izquierda)
2. Activa la opción **"Mostrar el archivo de manifiesto appsscript.json en el editor"**
3. Vuelve al editor (ícono `<>`)
4. Haz clic en el archivo **appsscript.json**
5. **Reemplaza todo** su contenido con esto:

```json
{
  "timeZone": "America/Lima",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.projects",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.send_mail"
  ]
}
```

6. Guarda con **Ctrl+S**

> [!CAUTION]
> Los scopes (permisos) son esenciales. Sin ellos, las notificaciones y el auto-update NO funcionarán. Copia el JSON exactamente como aparece.

---

<a id="paso-4"></a>
## ☁️ Paso 4: Crear un Proyecto en Google Cloud

1. Ve a **[console.cloud.google.com](https://console.cloud.google.com)**
2. Inicia sesión con la **misma cuenta de Google** que usaste para el Sheet
3. Si es tu primera vez, acepta los Términos de Servicio
4. Haz clic en **"Seleccionar proyecto"** (arriba a la izquierda)
5. Click en **"NUEVO PROYECTO"**
6. Nombre: **"MoneyCrock"** (o el que prefieras)
7. Click en **"Crear"**
8. Espera a que se cree y **selecciónalo** como proyecto activo
9. Ve a **Configuración** (ícono ⚙️) o **Panel** y **copia el "Número de proyecto"** (es un número largo como `1028272702630`)

> [!NOTE]
> Guardar el **Número de proyecto** (NO el ID del proyecto). Lo necesitarás en el Paso 7.

---

<a id="paso-5"></a>
## 🔌 Paso 5: Activar la Apps Script API (Google Cloud)

1. En Google Cloud Console, ve al **Menú ☰ → APIs y Servicios → Biblioteca**
   - O accede directamente: [console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)
2. En el buscador escribe: **"Apps Script API"**
3. Haz clic en **"Apps Script API"** (de Google Enterprise API)
4. Click en **"HABILITAR"**
5. Espera a que se active (verás "API habilitada ✅")

---

<a id="paso-6"></a>
## 👤 Paso 6: Activar la Apps Script API (Configuración de Usuario)

> [!WARNING]
> Este es un paso que muchos olvidan. Hay **DOS lugares** donde activar la API:
> - ✅ Google Cloud Console (Paso 5) → para el **proyecto**
> - ✅ Configuración de usuario (este paso) → para **tu cuenta**

1. Ve a **[script.google.com/home/usersettings](https://script.google.com/home/usersettings)**
2. Busca el switch de **"API de Google Apps Script"**
3. **Actívalo** (ponlo en ON)
4. Espera **2 minutos** para que se propague

---

<a id="paso-7"></a>
## 🔗 Paso 7: Vincular el Proyecto GCP con Apps Script

1. Vuelve a tu proyecto de **Apps Script** ([script.google.com](https://script.google.com))
2. Haz clic en **⚙️ Configuración del proyecto** (barra lateral izquierda)
3. Busca la sección **"Proyecto de Google Cloud Platform (GCP)"**
4. Haz clic en **"Cambiar proyecto"**
5. Pega el **Número de proyecto** que copiaste en el Paso 4
6. Click en **"Establecer proyecto"**
7. Confirma que aparezca el número del proyecto vinculado

---

<a id="paso-8"></a>
## 🌐 Paso 8: Desplegar la Aplicación Web

1. En Apps Script, haz clic en **"Implementar" → "Nueva implementación"** (botón azul arriba a la derecha)
2. Haz clic en el ícono de ⚙️ al lado de "Seleccionar tipo" → selecciona **"Aplicación web"**
3. Configura:
   - **Descripción:** `MoneyCrock v1`
   - **Ejecutar como:** `Yo (tu email)`
   - **Quién tiene acceso:** `Cualquier persona`
4. Click en **"Implementar"**
5. **¡COPIA LA URL!** Se ve así:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

> [!CAUTION]
> **NUNCA compartas esta URL públicamente.** Cualquiera con la URL y tu PIN puede acceder a tus datos financieros.

---

<a id="paso-9"></a>
## ✅ Paso 9: Autorizar Todos los Permisos

1. En Apps Script, selecciona la función **`checkForUpdate`** en el selector de funciones (arriba)
2. Click en **▶ Ejecutar**
3. Aparecerá una ventana de **autorización de Google**:
   - Click en **"Revisar permisos"**
   - Selecciona tu cuenta de Google
   - Si dice **"Esta app no es verificada"**: click en **"Avanzado"** → **"Ir a Proyecto sin título (no seguro)"**
   - Click en **"Permitir"**

Los permisos que autorizarás:
| Permiso | Para qué |
|---------|----------|
| Google Sheets | Leer/escribir tus datos financieros |
| Servicio externo | Conectar a GitHub para auto-actualizaciones |
| Script Projects | Auto-actualizar el código del GAS |
| Gmail / Mail | Enviar notificaciones por email |

4. Verifica en el **Registro de ejecución** que no hay errores

---

<a id="paso-10"></a>
## 📱 Paso 10: Conectar la App con tu Script

1. Abre **MoneyCrock** en tu navegador: **[https://finanzas-gastos.vercel.app](https://finanzas-gastos.vercel.app)** _(o la URL de tu deploy)_
2. Pega la **URL del script** (del Paso 8) en el campo correspondiente
3. Ingresa tu **PIN** (por defecto: `1234`)
4. Click en **"Comenzar"**
5. ¡Deberías ver el Dashboard! 🎉

> [!TIP]
> Cambia el PIN por defecto inmediatamente desde tu Google Sheet → hoja **Config** → celda **A2**.

---

<a id="paso-11"></a>
## 📧 Paso 11: Configurar Notificaciones por Email

1. En MoneyCrock, ve a **⚙️ Configuración** (ícono de engranaje)
2. Busca la sección **"Notificaciones"**
3. Activa las notificaciones
4. Ingresa tu **email** donde quieres recibir alertas
5. Configura los **días de anticipación** (ej: 3 días antes del vencimiento)
6. Click en **"Guardar"**
7. Click en **"Enviar email de prueba"** para verificar

Si el email de prueba no llega:
- Revisa la carpeta de **Spam**
- Verifica que autorizaste los permisos de Gmail/Mail en el Paso 9
- Ejecuta `enviarEmailPrueba` directamente desde Apps Script y revisa los logs

### Configurar Trigger Diario (Notificaciones Automáticas)

1. En la app, busca el botón **"Configurar Trigger Diario"**
2. Esto programará un envío automático diario a las 8:00 AM
3. Recibirás notificaciones cuando tus pagos estén próximos a vencer

---

<a id="paso-12"></a>
## 🔄 Paso 12: Verificar el Auto-Update del GAS

El auto-update permite que tu código de Apps Script se actualice solo desde GitHub cada 24 horas.

### Verificar que funciona:

1. En Apps Script, selecciona la función **`checkForUpdate`**
2. Click en **▶ Ejecutar**
3. En el **Registro de ejecución** deberías ver:
   ```
   Código actualizado exitosamente: v1 → v4
   Nueva versión creada: X
   Auto-update completo: v1 → v4
   ```

### Si sale error:

| Error | Solución |
|-------|----------|
| `Permission to call UrlFetchApp.fetch` | Repite el Paso 9 (autorizar permisos) |
| `User has not enabled the Apps Script API` | Repite el Paso 6 (activar API de usuario) |
| `Auto-update falló (código 403)` | Verificar Pasos 5, 6 y 7 |
| `No se pudo enviar email` | Solo es la notificación, el update sí funcionó |

> [!NOTE]
> El auto-update chequea cada 24h automáticamente. No necesitas hacer nada después de la primera vez.

---

<a id="paso-13"></a>
## ✅ Paso 13: Verificación Final

Verifica que todo funciona:

- [ ] La app se conecta y muestra el Dashboard
- [ ] Puedes registrar un gasto de prueba
- [ ] Puedes registrar un ingreso de prueba
- [ ] El gasto/ingreso aparece en tu Google Sheet
- [ ] Las notificaciones por email funcionan (email de prueba)
- [ ] El auto-update del GAS funcionó (GAS_VERSION actualizado)
- [ ] El PIN se puede cambiar desde la hoja Config

---

## 🔐 Seguridad — Recordatorios

- ⚠️ **Cambia el PIN** por defecto (`1234`) inmediatamente
- ⚠️ **NUNCA** compartas tu URL del script públicamente
- ⚠️ **NUNCA** subas tu URL o PIN a repositorios públicos
- ✅ Tus datos están en **TU** Google Sheet, bajo **TU** cuenta
- ✅ Puedes cambiar el PIN cuando quieras desde la hoja Config

---

## 🆘 Solución de Problemas Comunes

| Problema | Solución |
|----------|----------|
| "PIN inválido" | Verificar celda A2 de la hoja Config |
| La app no conecta | Verificar que la URL termine en `/exec` |
| No se registran datos | Verificar permisos del script |
| No llegan notificaciones | Revisar Spam, verificar permisos de Gmail |
| El auto-update no funciona | Verificar Pasos 5, 6, 7 y 9 |
| "Hoja no encontrada" | Los nombres de hojas deben ser exactos |
| Datos vacíos en la app | Verificar que el Google Sheet tiene datos |

---

## 🎯 Próximos Pasos

¡Ya tienes todo configurado! Ahora:

1. 👤 **Configura tu perfil** — nombre y avatar
2. 💳 **Registra tus tarjetas** de crédito/débito
3. 💰 **Registra tus ingresos** del mes
4. 💸 **Empieza a registrar gastos** diarios
5. 🎯 **Crea tus metas** de ahorro
6. 📊 **Revisa tu Dashboard** para ver el resumen

---

> **¡Disfruta gestionando tus finanzas con MoneyCrock!** 💰🐊
