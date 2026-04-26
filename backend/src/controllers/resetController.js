import pool from '../config/database.js';

export const masterReset = async (req, res) => {
  try {
    // Verificar que sea una solicitud POST y que incluya confirmación
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Método no permitido. Use POST.'
      });
    }

    const { confirmed } = req.body;

    if (!confirmed) {
      return res.status(400).json({
        error: 'Reseteo no confirmado. Agregue "confirmed": true en el body.'
      });
    }

    // Iniciar transacción
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Limpiar tablas y reiniciar IDs sin requerir privilegios de superusuario
      await client.query(`
        TRUNCATE TABLE purchases, sales, inventory, products
        RESTART IDENTITY CASCADE
      `);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Reseteo maestro completado exitosamente',
        deletedTables: ['products', 'sales', 'purchases', 'inventory'],
        timestamp: new Date().toISOString(),
        note: 'Los usuarios han sido mantenidos. Solo se eliminaron datos transaccionales e inventario.'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error en reseteo maestro:', error);
    res.status(500).json({
      error: 'Error durante el reseteo maestro',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

/**
 * Endpoint para obtener información de qué se eliminaría en el reseteo
 */
export const getMasterResetInfo = async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      // Contar registros en cada tabla
      const tables = ['products', 'sales', 'purchases', 'inventory'];
      const counts = {};

      for (const table of tables) {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count, 10);
      }

      res.json({
        message: 'Información del Reseteo Maestro',
        recordsToDelete: counts,
        totalRecords: Object.values(counts).reduce((a, b) => a + b, 0),
        warning: 'Esta operación es irreversible. Realice un backup antes de proceder.'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error al obtener info del reseteo:', error);
    res.status(500).json({
      error: 'Error al obtener información del reseteo',
      message: error.message
    });
  }
};
