# 🔄 RESETEO MAESTRO - REFERENCIA RÁPIDA

## 🎯 ¿Qué Hace?
Elimina todos los registros de tablas transaccionales (ventas, compras, productos, inventario) manteniendo los usuarios del sistema.

## 📍 ¿Dónde Está?
**Dashboard** → Esquina superior derecha → Botón rojo "🗑️ Reseteo Maestro"

## 🔒 Confirmaciones Requeridas
1. ✋ Hacer clic en "Proceder a Confirmación"
2. 🔐 Escribir exactamente: **`RESETEAR_TODO`** (mayúsculas)
3. ✅ Confirmar: "Ejecutar Reseteo"

## ⚠️ IMPORTANTE
- **NO SE PUEDE DESHACER** ❌
- Hacer **BACKUP** antes de usar ✅
- Solo accesible con autenticación 🔑
- Transacción atómica (rollback si hay error) ⚛️

## 🗂️ Tablas Eliminadas
| Tabla | Estado |
|-------|--------|
| products | 🗑️ Eliminada |
| sales | 🗑️ Eliminada |
| purchases | 🗑️ Eliminada |
| inventory | 🗑️ Eliminada |
| **users** | **✅ Protegida** |

## 📊 Pasos
```
1. Dashboard → Botón "Reseteo Maestro"
   ↓
2. Leer información (cantidad de registros)
   ↓
3. Escribir "RESETEAR_TODO"
   ↓
4. Hacer clic "Ejecutar Reseteo"
   ↓
5. ✅ Completado (modal cierra automáticamente)
```

## API Endpoints
```
GET  /api/reset/info              → Información (sin cambios)
POST /api/reset/execute           → Ejecutar reseteo
     { "confirmed": true }
```

## 🚀 Próximos Pasos Después del Reseteo
- Base de datos vacía (excepto users)
- Contadores SERIAL resetados a 1
- Sistema listo para empezar de nuevo
- Usuarios pueden volver a iniciar sesión

---

**Creado:** 20 de Abril de 2026  
**Versión:** 1.0
