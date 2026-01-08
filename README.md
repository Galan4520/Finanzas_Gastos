# 💰 MoneyCrock

**Tu gestor de finanzas personales inteligente y elegante**

MoneyCrock es una aplicación web moderna para gestionar tus finanzas personales, tarjetas de crédito, gastos a cuotas, suscripciones y metas de ahorro. Todo sincronizado con Google Sheets para tener control total de tus datos.

## ✨ Características

### 📊 Dashboard Inteligente
- **Balance Total** en tiempo real (Ingresos - Gastos)
- Resumen mensual de ingresos y gastos
- Salud crediticia de tus tarjetas
- Historial de transacciones con íconos visuales
- Gráficos de tendencias

### 💳 Gestión de Tarjetas de Crédito
- Registra múltiples tarjetas con límites y fechas de cierre/pago
- Visualiza el uso y disponibilidad de cada tarjeta
- Control de deudas y compras a cuotas
- Seguimiento de suscripciones recurrentes

### 💸 Registro de Transacciones
- Gastos en efectivo por categorías
- Ingresos con categorización
- Compras a cuotas en tarjetas de crédito
- Suscripciones mensuales/anuales
- Notas y detalles personalizados

### 🎯 Metas de Ahorro
- Define tu meta anual de ahorro
- Seguimiento mensual automático
- Indicadores de progreso visual
- Motivación con propósitos personalizados

### 📈 Reportes Detallados
- Gráficos de gastos por categoría
- Tendencias mensuales
- Análisis de ingresos vs gastos
- Exportación de datos (próximamente)

### 🔒 Seguridad y Privacidad
- Autenticación con PIN personalizado
- **Tus datos permanecen en TU Google Sheet**
- Sin servidores externos
- Control total sobre tu información

## 🚀 Inicio Rápido

### Para Nuevos Usuarios

¿Primera vez usando MoneyCrock? Sigue nuestra guía completa de configuración:

📖 **[Guía de Configuración Completa (SETUP.md)](SETUP.md)**

La guía incluye:
- Opción 1: Usar plantilla predefinida (10 minutos)
- Opción 2: Configuración manual paso a paso
- Despliegue del script de Google Apps Script
- Configuración de seguridad

### Requisitos Previos

- Una cuenta de Google (Gmail)
- 10 minutos de tu tiempo

### Pasos Básicos

1. **[📋 Copia la plantilla de Google Sheets](https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy)** (o crea una siguiendo [TEMPLATE_STRUCTURE.md](TEMPLATE_STRUCTURE.md))
2. **Despliega el script** desde Google Apps Script (Extensions → Apps Script → Deploy)
3. **Conecta la aplicación** con la URL del script y tu PIN (por defecto: 1234)
4. **¡Listo!** Empieza a gestionar tus finanzas

**Tiempo estimado:** 10 minutos | **Dificultad:** Fácil

## 📚 Documentación

- **[SETUP.md](SETUP.md)** - Guía completa de configuración para nuevos usuarios
- **[TEMPLATE_STRUCTURE.md](TEMPLATE_STRUCTURE.md)** - Estructura detallada de Google Sheets
- **google-apps-script-updated.js** - Código del backend (Google Apps Script)

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React (iconografía elegante)
- **Gráficos**: Recharts
- **Backend**: Google Apps Script
- **Base de Datos**: Google Sheets
- **Deployment**: Cualquier hosting estático (Netlify, Vercel, GitHub Pages)

## 🎨 Diseño

- **Tema oscuro** profesional (Slate 900)
- **Tipografía**: Inter + JetBrains Mono
- **Responsive**: Optimizado para móviles y desktop
- **Accesibilidad**: Screenshots habilitados en móviles
- **Iconografía**: Lucide React para UI, emojis para categorías

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 📱 Características Móviles

- PWA (Progressive Web App) compatible
- Screenshots habilitados
- Diseño responsive optimizado
- Barra de estado personalizada
- Iconos de aplicación web

## 🤝 Compartir con Otros

¿Quieres que más personas usen MoneyCrock?

### Enlace Directo de la Plantilla
```
https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy
```

### Instrucciones para Compartir

1. **Comparte el enlace de la plantilla** (arriba) - crea una copia automática
2. **Comparte la aplicación web** desplegada (Netlify, Vercel, etc.)
3. **Cada usuario sigue [SETUP.md](SETUP.md)** desde el Paso 2

**Importante:** Cada persona tendrá su propia Google Sheet independiente. ¡Nunca compartas tu URL de script personal!

Más detalles en la sección "Para Compartir con Otros" de [SETUP.md](SETUP.md)

## 🔐 Seguridad

- Nunca compartas tu URL del script públicamente
- Nunca subas tu PIN a repositorios públicos
- Cambia el PIN por defecto (1234) inmediatamente
- Tus datos están bajo tu control en tu Google Drive

## 🐛 Solución de Problemas

### La aplicación no conecta
- Verifica que la URL del script termine en `/exec`
- Asegúrate de haber autorizado todos los permisos
- Confirma que el PIN sea correcto

### No se registran transacciones
- Verifica que todas las hojas existan con nombres exactos
- Revisa que los encabezados estén en la fila 1
- Consulta [TEMPLATE_STRUCTURE.md](TEMPLATE_STRUCTURE.md)

### Los pagos no actualizan el balance
- Verifica que estés usando la versión más reciente del código
- Los pagos ahora se registran automáticamente como gastos

## 📝 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo, modificarlo y compartirlo.

## 🙏 Contribuciones

Las contribuciones son bienvenidas. Si encuentras un bug o tienes una sugerencia:

1. Abre un issue describiendo el problema
2. Si quieres contribuir código, crea un pull request
3. Mantén el código limpio y documentado

## 💡 Próximas Características

- [ ] Exportación de reportes a PDF
- [ ] Notificaciones de fechas de pago
- [ ] Modo claro/oscuro configurable
- [ ] Múltiples usuarios/perfiles
- [ ] Importación de extractos bancarios
- [ ] Presupuestos por categoría

## 📞 Soporte

¿Necesitas ayuda? Consulta primero:
1. [SETUP.md](SETUP.md) - Guía de configuración
2. [TEMPLATE_STRUCTURE.md](TEMPLATE_STRUCTURE.md) - Estructura de datos
3. Issues del repositorio

---

**Hecho con ❤️ para ayudarte a gestionar mejor tu dinero**

*MoneyCrock - Porque tus finanzas también merecen buen diseño*
