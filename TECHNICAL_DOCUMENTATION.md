# Documentación Técnica - Sistema de Control Financiero "Finanzas_Gastos"

## 1. Introducción
**Finanzas_Gastos** es una aplicación web progresiva (PWA) diseñada para la gestión integral de finanzas personales. Permite a los usuarios registrar ingresos y gastos, gestionar deudas de tarjetas de crédito con cálculo de cuotas, establecer metas de ahorro y monitorear activos inmobiliarios.

El sistema se destaca por su arquitectura "Serverless" utilizando **Google Apps Script** como backend y **Google Sheets** como base de datos, lo que garantiza gratuidad, privacidad y facilidad de acceso a los datos brutos.

## 2. Arquitectura del Sistema

La solución sigue una arquitectura cliente-servidor desacoplada:

```mermaid
graph TD
    User[Usuario Final] -->|Interactúa| Frontend[Frontend React + Vite]
    Frontend -->|API Calls (GET/POST)| Backend[Google Apps Script]
    Backend -->|Lee/Escribe| DB[(Google Sheets)]
    
    subgraph "Frontend Layer"
        Frontend
        LocalStorage[LocalStorage (Caché & Config)]
    end
    
    subgraph "Google Cloud Platform"
        Backend
        DB
    end
```

### Componentes Principales:
1.  **Frontend**: Single Page Application (SPA) construida con React 18, TypeScript y Vite. Alojada en cualquier hosting estático (Netlify/Vercel).
2.  **Backend**: Script de Google Apps Script (GAS) publicado como Web App. Maneja la lógica de negocio y validación.
3.  **Base de Datos**: Libro de Google Sheets con pestañas para `Movimientos`, `Config`, `Presupuesto`, etc.

## 3. Estructura del Proyecto

El código fuente del frontend se organiza de la siguiente manera:

```text
src/
├── components/          # Componentes React reutilizables
│   ├── forms/           # Formularios complejos (UnifiedEntryForm, PaymentForm)
│   ├── ui/              # Elementos UI base (Modales, Botones, Dialogs)
│   ├── Dashboard.tsx    # Vista principal con gráficos
│   ├── DebtList.tsx     # Gestión de deudas y tarjetas
│   └── Layout.tsx       # Estructura general de la app (Nav, Sidebar)
├── services/
│   └── googleSheetService.ts # Capa de comunicación con el Backend
├── utils/
│   ├── debtUtils.ts     # Lógica de normalización de deudas
│   └── format.ts        # Formateo de moneda y fechas
├── contexts/            # React Contexts (ThemeContext)
├── types.ts             # Definiciones de tipos TypeScript (Interfaces globales)
├── App.tsx              # Componente raíz y enrutamiento manual
└── main.tsx             # Punto de entrada de Vite
```

## 4. Modelos de Datos (Types)

La aplicación utiliza tipos estrictos para garantizar la integridad de los datos.

### 4.1. Transacción (`Transaction`)
Representa un ingreso o un gasto simple.
```typescript
interface Transaction {
  fecha: string;        // YYYY-MM-DD
  categoria: string;    // Ej: "Alimentación"
  descripcion: string;
  monto: number;
  tipo: 'Gastos' | 'Ingresos';
  timestamp: string;    // ID único basado en fecha
}
```

### 4.2. Gasto Pendiente / Deuda (`PendingExpense`)
Representa una compra con tarjeta de crédito o una suscripción.
```typescript
interface PendingExpense {
  id: string;
  tarjeta: string;       // Alias de la tarjeta
  descripcion: string;
  monto: number;         // Monto total original
  num_cuotas: number;    // 1 para directo, >1 para cuotas
  cuotas_pagadas: number; 
  monto_pagado_total: number; // Acumulado pagado
  estado: 'Pendiente' | 'Pagado';
  tipo: 'deuda' | 'suscripcion';
}
```

## 5. Lógica del Backend (Google Apps Script)

El backend expone dos métodos principales a través de `doGet` y `doPost`.

### 5.1. `doGet(e)`
Sirve para:
1.  **Lectura de datos**: Retorna un JSON con todas las tarjetas, gastos pendientes, historial y configuración.
2.  **Seguridad**: Valida un `PIN` enviado como parámetro.

### 5.2. `processEntry(data)`
Función interna que procesa las escrituras. Maneja lógica compleja como:
*   **Compras en Cuotas**: Divide el monto total si es necesario o simplemente registra la deuda.
*   **Pagos de Tarjeta**: Cuando se registra un pago de tarjeta, busca las deudas asociadas y actualiza su saldo/estado a "Pagado" si corresponde.
*   **Proyección de Pagos**: Calcula automáticamente las fechas de cierre y pago basadas en la configuración de la tarjeta.

## 6. Funcionalidades Clave

### 6.1. Sincronización Optimista
El frontend actualiza la UI inmediatamente (Optimistic UI) al crear o editar registros, prometiendo una experiencia rápida. En segundo plano, envía los datos a Google Sheets. Si falla, el usuario recibe una notificación y puede reintentar.

### 6.2. Gestión de Suscripciones
Las suscripciones se tratan como un tipo especial de "Deuda" que no necesariamente disminuye su saldo total, sino que representa un cargo recurrente mensual. Se visualizan separadas de las deudas de compras.

### 6.3. Modo Offline (Parcial)
Gracias a `localStorage`, la aplicación guarda una copia de los últimos datos sincronizados (`cards`, `pendingExpenses`, `profile`), permitiendo ver la información incluso sin conexión inmediata (aunque no editar y guardar).

## 7. Guía de Despliegue

1.  **Backend**:
    *   Copiar el contenido de `google-apps-script-NUEVO.js` en un proyecto de Apps Script vinculado a un Sheet.
    *   Desplegar como "Aplicación web".
    *   Acceso: "Cualquier persona".

2.  **Frontend**:
    *   Ejecutar `npm run build`.
    *   Subir la carpeta `dist/` a cualquier hosting (Netlify, Vercel, GitHub Pages).

---
*Documentación generada automáticamente por Antigravity*
