import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validaciones
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Usuario, email y contraseña son requeridos'
      });
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar username no contenga espacios
    if (username.includes(' ')) {
      return res.status(400).json({
        error: 'El usuario no puede contener espacios'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name',
      [username, email, hashedPassword, full_name || null]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en registro:', error.message);

    // Errors de unicidad
    if (error.code === '23505') {
      const field = error.detail?.includes('username') ? 'usuario' : 'email';
      return res.status(409).json({
        error: `El ${field} ya existe`
      });
    }

    res.status(500).json({
      error: 'Error al registrar usuario. Intenta de nuevo.'
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION || '7d',
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({
      error: 'Error al iniciar sesión. Intenta de nuevo.'
    });
  }
};
