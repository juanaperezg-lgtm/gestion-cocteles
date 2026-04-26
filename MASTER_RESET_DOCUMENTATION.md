# 🔄 Función de Reseteo Maestro - Documentación

## Descripción

Se ha implementado una función **Reseteo Maestro** que permite eliminar de manera segura y controlada todos los registros de las tablas transaccionales de la base de datos, manteniendo intactos los datos de usuarios.

## Tablas Afectadas

El reseteo maestro elimina registros de las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| **products** | Productos/Cócteles registrados |
| **sales** | Todas las ventas realizadas |
| **purchases** | Todas las compras de proveedores |
| **inventory** | Resumen de inventario |

### Tablas Protegidas
- ✅ **users** - Los usuarios del sistema se mantienen intactos

## Ubicación del Botón

El botón de **Reseteo Maestro** se encuentra en:
- **Página:** Dashboard
- **Ubicación:** Esquina superior derecha, junto al título "📊 Dashboard"
- **Icono:** 🗑️ (Trash)
- **Color:** Rojo (#dc2626) para indicar operación crítica

## Cómo Usar

### Paso 1: Acceder al Dashboard
Inicia sesión en la aplicación y dirígete al Dashboard.

### Paso 2: Hacer Clic en el Botón
Localiza el botón rojo "Reseteo Maestro" en la esquina superior derecha.

### Paso 3: Revisar Información (Etapa 1)
Se abrirá un modal con:
- ⚠️ Advertencia de operación irreversible
- 📊 Cantidad de registros a eliminar por tabla
- 💡 Recomendación de hacer backup
- ℹ️ Nota que los usuarios se mantienen

**Botones disponibles:**
- ❌ "Cancelar" - Cierra el modal sin hacer cambios
- ⚠️ "Proceder a Confirmación" - Avanza a la etapa 2

### Paso 4: Confirmación Final (Etapa 2)
Se requiere escribir la palabra clave: **`RESETEAR_TODO`** (en mayúsculas)

- Esta palabra debe escribirse exactamente como aparece
- El botón "Ejecutar Reseteo" solo se habilitará cuando se escriba correctamente
- **Botones disponibles:**
  - 🔙 "Volver Atrás" - Regresa a la etapa anterior
  - 🔴 "Ejecutar Reseteo" - Ejecuta el reseteo (solo si la palabra clave es correcta)

### Paso 5: Confirmación de Éxito (Etapa 3)
Si el reseteo fue exitoso:
- ✅ Aparecerá un mensaje de confirmación
- El modal se cerrará automáticamente después de 3 segundos
- Todos los registros transaccionales han sido eliminados

## Características de Seguridad

### 1. **Autenticación Requerida**
- Solo usuarios autenticados pueden acceder al reseteo
- Requiere token JWT válido

### 2. **Confirmación Doble**
- **Primera confirmación:** Hacer clic en "Proceder a Confirmación"
- **Segunda confirmación:** Escribir la palabra clave "RESETEAR_TODO"

### 3. **Protección contra Eliminación Accidental**
- Requiere escribir exactamente "RESETEAR_TODO" (mayúsculas)
- El botón solo se habilita cuando se escribe correctamente

### 4. **Transacción Atómica**
- Todos los cambios se realizan en una sola transacción
- Si algo falla, se hace ROLLBACK y no se elimina nada

### 5. **Reseteo de Secuencias**
- Los contadores (SERIAL) se reinician a 1
- Las próximas inserciones comenzarán desde ID 1

## Endpoints de la API

### Obtener Información del Reseteo
```bash
GET /api/reset/info
Headers: Authorization: Bearer {token}

Response:
{
  "message": "Información del Reseteo Maestro",
  "recordsToDelete": {
    "products": 15,
    "sales": 42,
    "purchases": 8,
    "inventory": 15
  },
  "totalRecords": 80,
  "warning": "Esta operación es irreversible. Realice un backup antes de proceder."
}
```

### Ejecutar Reseteo Maestro
```bash
POST /api/reset/execute
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "confirmed": true
}

Response (Éxito):
{
  "success": true,
  "message": "Reseteo maestro completado exitosamente",
  "deletedTables": ["products", "sales", "purchases", "inventory"],
  "timestamp": "2026-04-20T08:23:15.963Z",
  "note": "Los usuarios han sido mantenidos. Solo se eliminaron datos transaccionales e inventario."
}
```

## Flujo de la Aplicación

```
┌─────────────────────────────────┐
│   Dashboard - Botón Visible      │
└────────────┬────────────────────┘
             │ Click
             ▼
┌─────────────────────────────────┐
│ ETAPA 1: Información del Reseteo │
│ - Mostrar registros a eliminar   │
│ - Advertencia de irreversibilidad│
│ - Botones: Cancelar / Proceder   │
└────────────┬────────────────────┘
             │ Proceder
             ▼
┌─────────────────────────────────┐
│ ETAPA 2: Confirmación Final      │
│ - Requerida palabra clave        │
│ - Botones: Volver Atrás / Resetear│
└────────────┬────────────────────┘
             │ Ejecutar
             ▼
┌─────────────────────────────────┐
│ ETAPA 3: Reseteo Completado      │
│ - Mensaje de confirmación        │
│ - Cierre automático en 3 seg.    │
└─────────────────────────────────┘
```

## Recomendaciones

✅ **ANTES de hacer un Reseteo Maestro:**
1. Hacer un backup de la base de datos
2. Asegurarse de que nadie esté usando el sistema
3. Verificar que es realmente necesario

⚠️ **IMPORTANTE:**
- Esta operación **no se puede deshacer**
- No hay papelera de reciclaje
- Todos los datos transaccionales se eliminarán permanentemente
- Los usuarios se mantienen para poder volver a iniciar sesión

## Archivos Creados/Modificados

### Nuevos Archivos:
- `backend/src/controllers/resetController.js` - Lógica del reseteo
- `backend/src/routes/reset.js` - Rutas de reseteo
- `frontend/src/components/MasterReset.jsx` - Componente React
- `frontend/src/styles/MasterReset.css` - Estilos del componente

### Archivos Modificados:
- `backend/src/app.js` - Agregada ruta de reseteo
- `frontend/src/services/api.js` - Agregado resetAPI
- `frontend/src/pages/Dashboard.jsx` - Integrado componente MasterReset

## Soporte

Para reportar problemas o sugerencias sobre la función de Reseteo Maestro, contacta al equipo de desarrollo.
