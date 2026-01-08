# 🚀 Guía de Configuración para Nuevos Usuarios

¡Bienvenido a **MoneyCrock**! Esta guía te ayudará a configurar tu propia instancia de la aplicación en 10 minutos.

## 📋 Requisitos Previos

- Una cuenta de Google (Gmail)
- 10 minutos de tu tiempo

## 🎯 Opción 1: Usar la Plantilla (Recomendado)

### Paso 1: Copiar la Plantilla de Google Sheets

1. **Abre la plantilla pública:** [📋 Click aquí para copiar la plantilla](https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy)
2. Google te pedirá **hacer una copia** automáticamente
3. Dale un nombre (ej: "Mis Finanzas 2026")
4. Click en **Hacer una copia**

✅ ¡Listo! La plantilla ya incluye:
- Todas las hojas necesarias (Gastos, Ingresos, Tarjetas, etc.)
- El script de Apps Script pre-configurado
- PIN por defecto configurado

### Paso 2: Desplegar el Script

1. En tu copia de Google Sheets, ve a **Extensiones → Apps Script**
2. El código ya está ahí, solo necesitas desplegarlo
3. Click en **Implementar → Nueva implementación**
4. Selecciona:
   - **Tipo:** Aplicación web
   - **Ejecutar como:** Yo (tu email)
   - **Quién tiene acceso:** Cualquier persona
5. Click en **Implementar**
6. Autoriza los permisos cuando te lo pida
7. **COPIA LA URL** que te da (se ve así: `https://script.google.com/macros/s/XXXXX/exec`)

### Paso 3: Conectar con la Aplicación

1. Abre MoneyCrock: [URL DE TU APP]
2. Pega la URL del script
3. Ingresa tu PIN (por defecto es `1234`)
4. Click en **Comenzar**

🎉 ¡Ya está! Ahora puedes empezar a usar la aplicación.

---

## 🛠️ Opción 2: Configuración Manual

Si prefieres crear todo desde cero:

### Paso 1: Crear Google Sheet

1. Crea un nuevo Google Sheet
2. Crea las siguientes hojas (pestañas):

#### Hoja: **Config**
```
A1: PIN
A2: 1234  (o el PIN que prefieras)
```

#### Hoja: **Tarjetas**
```
Columnas: alias | banco | tipo | limite | cierre | pago | timestamp
```

#### Hoja: **Gastos**
```
Columnas: fecha | categoria | descripcion | monto | notas | timestamp
```

#### Hoja: **Ingresos**
```
Columnas: fecha | categoria | descripcion | monto | notas | timestamp
```

#### Hoja: **Gastos_Pendientes**
```
Columnas: id | fecha_gasto | tarjeta | categoria | descripcion | monto | fecha_cierre | fecha_pago | estado | num_cuotas | cuotas_pagadas | notas | timestamp | tipo
```

#### Hoja: **Pagos**
```
Columnas: fecha_pago | id_gasto | tarjeta | descripcion_gasto | monto_pagado | tipo_pago | num_cuota | timestamp
```

#### Hoja: **Meta_Ahorro**
```
Columnas: meta_anual | ahorro_mensual_necesario | proposito | anio | timestamp
```

#### Hoja: **Perfil**
```
Columnas: nombre | avatar_id | timestamp
```

### Paso 2: Configurar el Script

1. Ve a **Extensiones → Apps Script**
2. Borra el código por defecto
3. Copia el código del archivo `google-apps-script-updated.js` (disponible en el repositorio)
4. Pega el código en el editor
5. Guarda (Ctrl+S o Cmd+S)

### Paso 3: Desplegar

Sigue el **Paso 2** de la Opción 1 (arriba)

---

## 🔒 Seguridad

### Cambiar tu PIN

1. Abre tu Google Sheet
2. Ve a la hoja **Config**
3. En la celda **A2**, cambia `1234` por tu PIN personalizado
4. Guarda
5. Usa el nuevo PIN en la aplicación

### Notas de Seguridad

- ⚠️ **NUNCA compartas tu URL del script públicamente**
- ⚠️ **NUNCA subas tu URL o PIN a GitHub/repositorios públicos**
- ✅ La URL permite a cualquiera con el PIN acceder a tus datos
- ✅ Puedes cambiar el PIN en cualquier momento
- ✅ Tus datos están en TU Google Sheet, bajo TU cuenta

---

## 🎓 Para Compartir con Otros

Si quieres que otras personas usen MoneyCrock:

### ¡Es muy fácil!

1. **Comparte el enlace de la plantilla:**
   ```
   https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy
   ```

2. **Comparte el link de la aplicación web:**
   - Si usas Netlify/Vercel: comparte tu URL de deploy
   - Si es local: cada persona debe ejecutar `npm run dev` localmente

3. **Instrucciones para nuevos usuarios:**
   - Click en el enlace de la plantilla → se crea copia automática
   - Seguir esta guía SETUP.md desde el Paso 2
   - Cada persona tendrá su propia Google Sheet independiente

**Nota:** Cada usuario necesita su propia copia de Google Sheet. El enlace `/copy` hace esto automáticamente. ¡No compartir las URLs de scripts personales!

---

## 📞 Soporte

¿Problemas con la configuración?

1. Verifica que la URL del script termine en `/exec`
2. Asegúrate de haber autorizado todos los permisos
3. Verifica que el PIN sea correcto (por defecto: `1234`)
4. Revisa que todas las hojas estén creadas con los nombres exactos

---

## 🎯 Próximos Pasos

Una vez configurado:

1. Registra tus tarjetas de crédito en **Configuración**
2. Configura tu meta de ahorro en **Metas**
3. Empieza a registrar transacciones en **Registrar**
4. Revisa tus finanzas en **Dashboard**

¡Disfruta gestionando tus finanzas! 💰
