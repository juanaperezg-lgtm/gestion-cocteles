# 📋 Resumen Técnico - Función Reseteo Maestro

## Resumen Ejecutivo

Se ha implementado una función **Reseteo Maestro** completa y segura que permite eliminar todos los registros transaccionales de la base de datos con múltiples niveles de protección.

### Tabla de Contenidos
- Tablas Afectadas
- Componentes Creados
- Flujo de Seguridad
- Uso de la API
- Testing

---

## 📊 Tablas Afectadas

| # | Tabla | Acción | Notas |
|---|-------|--------|-------|
| 1 | **products** | DELETE * | Se reinicia contador SERIAL a 1 |
| 2 | **sales** | DELETE * | Se reinicia contador SERIAL a 1 |
| 3 | **purchases** | DELETE * | Se reinicia contador SERIAL a 1 |
| 4 | **inventory** | DELETE * | Se reinicia contador SERIAL a 1 |
| ✅ | **users** | PROTEGIDA | No se elimina nada |

---

## 🏗️ Componentes Backend

### 1. Controlador: `backend/src/controllers/resetController.js`

**Función: `masterReset(req, res)`**
- Requiere autenticación
- Valida confirmación en body
- Ejecuta transacción atómica
- Desactiva restricciones FK temporalmente
- Reinicia secuencias SERIAL
- Retorna confirmación con timestamp

**Función: `getMasterResetInfo(req, res)`**
- Endpoint informativo
- Cuenta registros en cada tabla
- Proporciona advertencia
- No requiere parámetros POST

### 2. Rutas: `backend/src/routes/reset.js`

```javascript
GET  /api/reset/info     - Obtener info sin hacer cambios
POST /api/reset/execute  - Ejecutar reseteo (requiere confirmación)
```

Ambas rutas:
- Requieren autenticación (`authMiddleware`)
- Usan errores standarizados
- Retornan JSON estructurado

### 3. Integración: `backend/src/app.js`

```javascript
import resetRoutes from './routes/reset.js';
...
app.use('/api/reset', authMiddleware, resetRoutes);
```

---

## 🎨 Componentes Frontend

### 1. Componente React: `frontend/src/components/MasterReset.jsx`

**Features:**
- Modal con 3 etapas de flujo
- Control de estado con hooks
- Manejo de errores completo
- Feedback visual en tiempo real
- Protección contra eliminación accidental

**Estados:**
- `showModal` - Visibilidad del modal
- `showConfirm` - Etapa de confirmación final
- `resetInfo` - Datos de registros a eliminar
- `loading` - Estado de carga
- `feedback` - Mensajes de error/éxito
- `safetyInput` - Input de confirmación

**Métodos:**
- `openModal()` - Obtiene info y abre modal
- `handleConfirm()` - Valida palabra clave
- `executeReset()` - Ejecuta reseteo
- `closeModal()` - Cierra y limpia estado

### 2. Estilos: `frontend/src/styles/MasterReset.css`

**Estructura:**
- 7,717 caracteres de CSS
- Responsive design (mobile-first)
- Animaciones suaves
- Tema rojo para criticidad
- Estados: warning, critical, success, error

**Componentes:**
- `.master-reset-btn` - Botón principal
- `.modal-overlay` - Fondo semi-transparente
- `.modal-content` - Contenedor principal
- `.modal-header` - Encabezado con icono
- `.modal-body` - Contenido principal
- `.modal-actions` - Botones de acción
- `.records-summary` - Tabla de registros
- `.confirmation-input` - Campo de confirmación
- `.feedback-message` - Mensajes de error/éxito
- `.success-content` - Pantalla de éxito
- `.loading-spinner` - Spinner de carga

### 3. Integración en Dashboard: `frontend/src/pages/Dashboard.jsx`

```javascript
import MasterReset from '../components/MasterReset';

// En el JSX:
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
  <h1>📊 Dashboard</h1>
  <MasterReset />
</div>
```

### 4. Servicio API: `frontend/src/services/api.js`

```javascript
export const resetAPI = {
  getInfo: () => API.get('/reset/info'),
  execute: (data) => API.post('/reset/execute', data),
};
```

---

## 🔒 Niveles de Seguridad

### Nivel 1: Autenticación
✅ Token JWT requerido
✅ Middleware de autenticación en rutas

### Nivel 2: Información Previa
✅ Endpoint `/reset/info` muestra qué se eliminará
✅ Usuario puede revisar cantidad de registros

### Nivel 3: Primera Confirmación
✅ Botón "Proceder a Confirmación" requiere click consciente
✅ Modal muestra advertencia prominente

### Nivel 4: Segunda Confirmación
✅ Debe escribirse exactamente "RESETEAR_TODO"
✅ Botón deshabilitado hasta escribir correctamente
✅ Case-sensitive (mayúsculas obligatorias)

### Nivel 5: Transacción Atómica
✅ `BEGIN` transaction
✅ `ROLLBACK` si algo falla
✅ Desactiva FK constraints temporalmente
✅ Reinicia secuencias después

---

## 🔄 Flujo de Ejecución

```
Usuario abre Dashboard
         ↓
    Hace clic en botón rojo "Reseteo Maestro"
         ↓
    Modal Etapa 1: Información
    - Llamada GET /api/reset/info
    - Muestra cantidad de registros
    - Advertencia de irreversibilidad
         ↓
    Usuario elige: Cancelar o Proceder
         ↓
    Modal Etapa 2: Confirmación Final
    - Campo de texto para "RESETEAR_TODO"
    - Botón deshabilitado hasta escribir correctamente
         ↓
    Usuario elige: Volver Atrás o Ejecutar Reseteo
         ↓
    Llamada POST /api/reset/execute
    - Backend verifica autenticación
    - Valida confirmed = true
    - Inicia transacción
    - Elimina registros
    - Reinicia secuencias
    - Commit de transacción
         ↓
    Modal Etapa 3: Éxito
    - Mensaje de confirmación
    - Cierre automático en 3 segundos
         ↓
    Dashboard se actualiza o recarga
```

---

## 📡 Respuestas API

### GET /api/reset/info - Respuesta Exitosa

```json
{
  "message": "Información del Reseteo Maestro",
  "recordsToDelete": {
    "products": 5,
    "sales": 12,
    "purchases": 3,
    "inventory": 5
  },
  "totalRecords": 25,
  "warning": "Esta operación es irreversible. Realice un backup antes de proceder."
}
```

### POST /api/reset/execute - Respuesta Exitosa

```json
{
  "success": true,
  "message": "Reseteo maestro completado exitosamente",
  "deletedTables": ["products", "sales", "purchases", "inventory"],
  "timestamp": "2026-04-20T08:23:15.963Z",
  "note": "Los usuarios han sido mantenidos. Solo se eliminaron datos transaccionales e inventario."
}
```

### Respuesta de Error

```json
{
  "error": "Error durante el reseteo maestro",
  "message": "Error description here",
  "stack": "... (solo en development)"
}
```

---

## 🧪 Testing Manual

### 1. Verificar Botón Existe
- [ ] Dashboard abierto
- [ ] Botón visible en esquina superior derecha
- [ ] Botón tiene icono de papelera

### 2. Abrir Modal
- [ ] Clic en botón abre modal
- [ ] Modal muestra etapa 1 (información)
- [ ] Se cargan registros a eliminar

### 3. Cancelar
- [ ] Botón "Cancelar" cierra modal
- [ ] Estado se limpia

### 4. Proceder
- [ ] Botón "Proceder a Confirmación" abre etapa 2
- [ ] Campo de confirmación enfocado
- [ ] Botón "Ejecutar" deshabilitado inicialmente

### 5. Validación de Palabra Clave
- [ ] Escribir "resetear_todo" no habilita botón (case-sensitive)
- [ ] Escribir "RESETEAR_TODO" habilita botón
- [ ] Campo convierte automáticamente a mayúsculas

### 6. Ejecución del Reseteo
- [ ] Clic en "Ejecutar Reseteo"
- [ ] Modal muestra carga
- [ ] Luego de completar, muestra etapa 3 (éxito)
- [ ] Modal se cierra automáticamente

### 7. Verificación en BD
- [ ] Tablas: products, sales, purchases, inventory están vacías
- [ ] Tabla users mantiene registros
- [ ] Contadores SERIAL comenzarían en 1 (próxima inserción)

---

## 📦 Archivos Modificados/Creados

### ✨ Nuevos Archivos (4)
1. `backend/src/controllers/resetController.js` - 104 líneas
2. `backend/src/routes/reset.js` - 12 líneas
3. `frontend/src/components/MasterReset.jsx` - 270 líneas
4. `frontend/src/styles/MasterReset.css` - 380 líneas

### 📝 Archivos Modificados (3)
1. `backend/src/app.js` - 2 cambios (import + route)
2. `frontend/src/services/api.js` - 1 adición (resetAPI)
3. `frontend/src/pages/Dashboard.jsx` - 2 cambios (import + JSX)

### 📄 Documentación (1)
1. `MASTER_RESET_DOCUMENTATION.md` - Guía de usuario

---

## 🚀 Despliegue

Todos los cambios están listos para desplegar:
1. Backend requiere reinicio de servidor Node
2. Frontend requiere rebuild (Vite)
3. No requiere cambios en BD (compatible con schema existente)
4. Requiere autenticación (no afecta usuarios no autenticados)

---

## ⚙️ Configuración de Base de Datos

Se asume PostgreSQL con:
- Tablas: `users`, `products`, `sales`, `purchases`, `inventory`
- Claves primarias SERIAL
- Relaciones FK desde sales/purchases/inventory a products

---

## 📝 Notas Importantes

⚠️ **ESTA OPERACIÓN NO PUEDE DESHACERSE**
- Los datos se pierden permanentemente
- No hay papelera de reciclaje
- Se recomienda backup antes

✅ **PROTECCIONES IMPLEMENTADAS**
- Múltiples confirmaciones
- Validación de palabra clave
- Transacción atómica
- Rollback en caso de error
- Solo usuarios autenticados

🔄 **SECUENCIAS RESETEADAS**
- products_id_seq → 1
- sales_id_seq → 1
- purchases_id_seq → 1
- inventory_id_seq → 1

---

**Fecha de Creación:** 20 de Abril de 2026
**Estado:** Implementación Completada ✅
**Versión:** 1.0
