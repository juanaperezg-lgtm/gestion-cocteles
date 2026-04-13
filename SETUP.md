# 🚀 SETUP GUÍA - Gestión de Coctelería

## Prerequisites
✅ Node.js 16+ instalado
✅ PostgreSQL 12+ instalado y en PATH
✅ Git

---

## 📋 PASO 1: Crear la Base de Datos

Abre **PowerShell o cmd** y ejecuta:

```bash
# 1. Crear la base de datos
createdb -U postgres cocteles_db

# 2. Crear todas las tablas (ejecuta desde la carpeta del proyecto)
psql -U postgres -d cocteles_db -f backend/database/schema.sql
```

**Si psql pide contraseña**, usa la que estableciste en PostgreSQL (por defecto vacía o "postgres")

**Verificar que funcionó:**
```bash
psql -U postgres -d cocteles_db -c "\dt"
```

Debería mostrarte las tablas: `users`, `products`, `sales`, `purchases`, `inventory`

---

## 📋 PASO 2: Configurar Backend

```bash
# Ir a carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env
```

**Editar `backend/.env`:**
```properties
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cocteles_db
DB_USER=postgres
DB_PASSWORD=       # (dejar vacío si no tienes contraseña, o agregar tu contraseña)
JWT_SECRET=mi_secreto_super_seguro_12345
JWT_EXPIRATION=7d
```

**Probar la conexión:**
```bash
npm run dev
```

Debería mostrar: `🍹 Backend corriendo en puerto 3001`

---

## 📋 PASO 3: Configurar Frontend

En **otra terminal/pestaña**:

```bash
# Ir a carpeta frontend (desde la raíz del proyecto)
cd frontend

# Instalar dependencias
npm install
```

**Ejecutar frontend:**
```bash
npm run dev
```

Debería mostrar: `Local: http://localhost:3000`

---

## 🎯 PASO 4: Usar la Aplicación

1. Abre http://localhost:3000 en tu navegador
2. Haz clic en **"Regístrate aquí"**
3. Crea una cuenta con:
   - Usuario: `admin`
   - Email: `admin@cocteles.com`
   - Contraseña: `123456`
   - Nombre: `Administrador`

4. ¡Listo! Ya puedes:
   - Ver el Dashboard
   - Registrar Ventas
   - Crear Productos

---

## 🔧 Troubleshooting

### Error: "psql: El término no se reconoce"
```bash
# Usa la ruta completa:
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d cocteles_db -f backend/database/schema.sql
```

### Error: "ECONNREFUSED" en backend
- Verifica que PostgreSQL esté corriendo
- Comprueba las credenciales en `.env`
- Asegúrate que `cocteles_db` existe: `createdb -U postgres cocteles_db`

### Error: "Module not found"
```bash
# Reinstala dependencias
npm install
```

### Puertos ocupados
- Port 3001 (backend): `netstat -ano | findstr :3001`
- Port 3000 (frontend): `netstat -ano | findstr :3000`

---

## 📚 Estructura de Carpetas

```
gestion-cocteles/
├── backend/              # Express API
│   ├── .env              # Config (crear desde .env.example)
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── config/database.js
│   └── package.json
│
├── frontend/             # React app
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/api.js
│   │   └── styles/
│   └── package.json
│
└── README.md
```

---

## 🎉 ¡Listo!

Backend: http://localhost:3001
Frontend: http://localhost:3000

API disponible en http://localhost:3001/api/health

---

## 📝 Notas

- Mantén ambos servidores (backend y frontend) corriendo
- Usa Ctrl+C para detener cualquier servidor
- Los datos se guardan en PostgreSQL (persisten entre reinicios)
- El token JWT expira en 7 días

---

**¿Tienes problemas?** Avísame con los detalles del error 🍹
