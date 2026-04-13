# 🍹 Gestión de Coctelería - Sistema de Ventas

Un sistema web completo para gestionar las ventas, inventario y análisis de un local de cócteles.

## Características

✅ **Dashboard en Tiempo Real**
- Resumen de ventas diarias y mensuales
- Cálculo automático de ganancias
- Productos más vendidos
- Margen de ganancia

✅ **Gestión de Ventas**
- Registrar y monitorear todas las ventas
- Historial completo con fechas y horarios
- Búsqueda y filtrado por producto/fecha

✅ **Gestión de Productos**
- Catálogo de cócteles, ingredientes y bebidas
- Precio compra vs precio venta
- Cálculo automático de margen de ganancia
- Control de stock

✅ **Autenticación Multi-usuario**
- Login seguro con JWT
- Registro de nuevos usuarios
- Acceso por equipos

✅ **Próximamente: Reportes**
- Reportes en PDF (diarios, semanales, mensuales)
- Exportación a CSV
- Gráficos avanzados

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL
- JWT para autenticación
- Bcryptjs para encriptación de contraseñas

**Frontend:**
- React 18
- Vite
- Axios para API calls
- React Router para navegación
- Recharts para gráficos

## Instalación

### 1. Clonar Repositorio

```bash
git clone <repo-url>
cd gestion-cocteles
```

### 2. Configurar Base de Datos

#### Crear Base de Datos PostgreSQL

```bash
createdb cocteles_db
psql -U your_user -d cocteles_db -f backend/database/schema.sql
```

O manualmente en pgAdmin:
1. Crear nueva base de datos: `cocteles_db`
2. Ejecutar el SQL del archivo `backend/database/schema.sql`

### 3. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Editar `.env` con tus datos de PostgreSQL:
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cocteles_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
JWT_SECRET=tu_secret_muy_seguro_aqui
JWT_EXPIRATION=7d
```

Iniciar backend:
```bash
npm run dev  # Desarrollo (con nodemon)
# o
npm start    # Producción
```

### 4. Configurar Frontend

```bash
cd frontend
npm install
```

Iniciar frontend:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### 1. Registro e Inicio de Sesión

- Visita `http://localhost:3000/login`
- Crea una nueva cuenta o inicia sesión

### 2. Dashboard

- Ve las estadísticas principales del día y mes
- Visualiza los productos más vendidos
- Monitorea ganancias y márgenes

### 3. Registrar Ventas

- Ve a la sección "Ventas"
- Selecciona producto, cantidad y precio
- Guarda la venta automáticamente

### 4. Gestionar Productos

- Ve a "Productos"
- Crea nuevos cócteles/ingredientes
- Visualiza el catálogo completo
- Ve automáticamente el margen de ganancia

## Estructura del Proyecto

```
gestion-cocteles/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Punto de entrada
│   │   ├── routes/                   # Rutas API
│   │   ├── controllers/               # Lógica de negocio
│   │   ├── config/
│   │   │   └── database.js           # Conexión PostgreSQL
│   │   └── middleware/
│   ├── database/
│   │   └── schema.sql                # Schema de BD
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                  # Punto de entrada
│   │   ├── App.jsx                   # Componente raíz
│   │   ├── pages/                    # Páginas principales
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sales.jsx
│   │   │   └── Products.jsx
│   │   ├── components/               # Componentes reutilizables
│   │   ├── services/                 # Llamadas a API
│   │   └── styles/                   # CSS
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   └── ...
│
├── README.md
└── .gitignore
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Productos
- `GET /api/products` - Obtener todos los productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id/stock` - Actualizar stock

### Ventas
- `GET /api/sales` - Obtener todas las ventas
- `POST /api/sales` - Registrar venta
- `GET /api/sales/by-date?date=YYYY-MM-DD` - Ventas por fecha

### Dashboard
- `GET /api/dashboard/today` - Estadísticas del día
- `GET /api/dashboard/month` - Estadísticas del mes

## Variables de Entorno

### Backend (.env)
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cocteles_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=tu_secret_key
JWT_EXPIRATION=7d
```

## Próximas Fases

- [ ] Reportes en PDF (diarios, semanales, mensuales)
- [ ] Exportación a CSV
- [ ] Gráficos avanzados con Recharts
- [ ] Sistema de compras/inventario
- [ ] Análisis de tendencias
- [ ] Roles y permisos avanzados
- [ ] Respaldos automáticos

## Troubleshooting

### Error de conexión a BD
- Verifica que PostgreSQL esté corriendo
- Comprueba las credenciales en `.env`
- Asegúrate que la base de datos existe

### Error de CORS
- El frontend está configurado para usar proxy con Vite
- Verifica que el backend esté corriendo en puerto 3001

### Token expirado
- El token JWT expira después de 7 días
- Los usuarios necesitarán login nuevamente

## Licencia

Proyecto personal

## Soporte

Para reportar bugs o sugerencias, contacta al equipo de desarrollo.

---

**Hecho con 🍷 para administradores de coctelería**
