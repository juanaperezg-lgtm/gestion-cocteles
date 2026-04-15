# Migración a Neon - Guía Completa

## Paso 1: Crear cuenta en Neon

1. Ve a https://neon.tech
2. Click en **"Sign Up"** (esquina superior derecha)
3. Crea cuenta con:
   - Email
   - Contraseña
   - O usa GitHub para ir más rápido

## Paso 2: Crear tu primer proyecto

1. Al entrar, haz click en **"Create a project"**
2. Dale un nombre: **cocteles** (o lo que prefieras)
3. Selecciona región: **North America (US)** (si estás en América Latina)
4. Click en **"Create project"**

⏳ Espera 30 segundos a que se cree la base de datos

## Paso 3: Obtener la cadena de conexión

1. Una vez creado, verás un panel con:
   - Database name: `neondb`
   - User: `neondb_owner`
   - Password: (varias líneas de caracteres)
   - Host: `ep_xxxx.us-east-1.aws.neon.tech`

2. **IMPORTANTE**: Copia la URL de conexión completa. 
   - Debería verse así:
   ```
   postgresql://neondb_owner:CONTRASEÑA@ep_xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. Guárdala en un lugar seguro (la necesitarás en el paso 5)

## Paso 4: Cambiar nombre de la BD

La BD se llama `neondb` por defecto, pero tú quieres que se llame `cocteles_db`.

1. En el panel de Neon, ve a **"SQL Editor"** (en la izquierda)
2. Ejecuta este comando:
   ```sql
   ALTER DATABASE neondb RENAME TO cocteles_db;
   ```
3. Presiona **Execute**

## Paso 5: Actualizar tu archivo .env

Abre el archivo: `c:\Users\juand\gestion-cocteles\backend\.env`

Cambia la línea de `DB_HOST` y agrega `DB_URL`:

**ANTERIOR:**
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cocteles_db
DB_USER=postgres
DB_PASSWORD=20murillo
JWT_SECRET=mi_secreto_super_seguro_12345
JWT_EXPIRATION=7d
```

**NUEVO:**
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:TU_PASSWORD@ep_xxxx.us-east-1.aws.neon.tech/cocteles_db?sslmode=require
JWT_SECRET=mi_secreto_super_seguro_12345
JWT_EXPIRATION=7d
```

⚠️ **REEMPLAZA:**
- `TU_PASSWORD` → La contraseña que ves en Neon
- `ep_xxxx` → El host exacto que ves en Neon

## Paso 6: Importar los datos

### Opción A: Con psql (Fácil)

1. Abre PowerShell
2. Ejecuta:
   ```powershell
   $env:PGPASSWORD="TU_PASSWORD_DE_NEON"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h ep_xxxx.us-east-1.aws.neon.tech -U neondb_owner -d cocteles_db -f "c:\Users\juand\gestion-cocteles\backups\cocteles_db_backup_20260414-211736.sql"
   ```

   **Reemplaza:**
   - `TU_PASSWORD_DE_NEON`
   - `ep_xxxx`
   - El nombre del archivo SQL (mira en backups/)

3. Espera a que termine (puede tardar 10-30 segundos)

### Opción B: Con SQL Editor de Neon (UI)

1. Ve a **SQL Editor** en Neon
2. Abre el archivo `backups\cocteles_db_backup_20260414-211736.sql` con Notepad
3. Copia TODO el contenido
4. Pega en el editor SQL de Neon
5. Presiona **Execute**

## Paso 7: Probar la conexión

1. Abre `c:\Users\juand\gestion-cocteles\backend`
2. Instala si es necesario:
   ```bash
   npm install
   ```
3. Inicia el backend:
   ```bash
   npm start
   ```
4. Abre `http://localhost:3001` en el navegador
5. Si funciona → ¡Migración exitosa! 🎉

## ✅ Checklist Final

- [ ] Cuenta creada en Neon
- [ ] Proyecto creado
- [ ] BD renombrada a `cocteles_db`
- [ ] URL de conexión copiada
- [ ] `.env` actualizado con `DATABASE_URL`
- [ ] Datos importados
- [ ] Backend conecta correctamente
- [ ] Frontend accede a datos sin problemas

## 🌍 Ahora puedes acceder desde cualquier lado

Tu aplicación funciona desde **cualquier PC, en cualquier red, en cualquier lugar del mundo**:
- BD en la nube ✅
- Se levanta automáticamente ✅
- No necesitas VPN ✅
- Los datos persisten ✅

¡Listo! 🚀
