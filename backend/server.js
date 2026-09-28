require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DB = require('./database.js');
const { isPostgresConfigured, query } = require('./db/pool');

const app = express();

// CORS: permite cualquier origen (dev, producción en Render, Vercel, vistas previas, etc.)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Endpoint de estado del sistema y BD con Heartbeat a PostgreSQL
app.get('/api/health', async (req, res) => {
  const pgActive = isPostgresConfigured();
  let dbStatus = 'ok';
  if (pgActive) {
    try {
      await query('SELECT 1;');
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
  }
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      type: pgActive ? 'PostgreSQL' : 'In-Memory (Mock / Local Fallback)',
      active: pgActive ? (dbStatus === 'ok') : true,
      dbStatus
    }
  });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await DB.findUsuario(correo, contrasena);
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error('Error en /api/auth/login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const usuarios = await DB.getAllUsuariosAsync();
    res.json(usuarios);
  } catch (err) {
    console.error('Error en GET /api/users:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const usuario = await DB.findUsuarioById(req.params.id);
    if (usuario) res.json(usuario);
    else res.status(404).json({ error: 'No encontrado' });
  } catch (err) {
    console.error('Error en GET /api/users/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const nuevoUsuario = await DB.createUsuarioAsync(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (err) {
    console.error('Error en POST /api/users:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const editado = await DB.updateUsuarioAsync(req.params.id, req.body);
    if (editado) res.json(editado);
    else res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (err) {
    console.error('Error en PUT /api/users/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const eliminado = await DB.deleteUsuarioAsync(req.params.id);
    if (eliminado) res.json({ success: true });
    else res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (err) {
    console.error('Error en DELETE /api/users/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Candidatos
app.get('/api/candidatos', async (req, res) => {
  try {
    const { estado, id_socio } = req.query;
    let candidatos;
    if (estado) {
      candidatos = await DB.getCandidatosByEstadoAsync(estado);
    } else if (id_socio) {
      candidatos = await DB.getCandidatosBySocioAsync(id_socio);
    } else {
      candidatos = await DB.getCandidatosAsync();
    }
    res.json(candidatos);
  } catch (err) {
    console.error('Error en GET /api/candidatos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/candidatos/:id', async (req, res) => {
  try {
    const candidato = await DB.getCandidatoByIdAsync(req.params.id);
    if (candidato) res.json(candidato);
    else res.status(404).json({ error: 'No encontrado' });
  } catch (err) {
    console.error('Error en GET /api/candidatos/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/candidatos', async (req, res) => {
  try {
    const nuevo = await DB.createCandidatoAsync(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error en POST /api/candidatos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/candidatos/:id', async (req, res) => {
  try {
    const editado = await DB.updateCandidatoAsync(req.params.id, req.body);
    if (editado) res.json(editado);
    else res.status(404).json({ error: 'Candidato no encontrado' });
  } catch (err) {
    console.error('Error en PUT /api/candidatos/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/candidatos/:id', async (req, res) => {
  try {
    const eliminado = await DB.deleteCandidatoAsync(req.params.id);
    if (eliminado) res.json({ success: true });
    else res.status(404).json({ error: 'Candidato no encontrado' });
  } catch (err) {
    console.error('Error en DELETE /api/candidatos/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Full state endpoint (retrocompatibilidad)
app.get('/api/db', async (req, res) => {
  try {
    const data = await DB.getAsync();
    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/db:', err.message);
    res.status(500).json({ error: 'Error obteniendo estado de la base de datos' });
  }
});

app.post('/api/db', async (req, res) => {
  try {
    await DB.saveAsync(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error en POST /api/db:', err.message);
    res.status(500).json({ error: 'Error guardando estado' });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await DB.resetAsync();
    res.json({ success: true });
  } catch (err) {
    console.error('Error en POST /api/reset:', err.message);
    res.status(500).json({ error: 'Error reiniciando estado' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mode = isPostgresConfigured() ? '🐘 PostgreSQL' : '💾 In-Memory Fallback';
  console.log(`✅ Servidor backend de JN Palabras ejecutándose en http://localhost:${PORT}`);
  console.log(`🗄️  Modo de Base de Datos: ${mode}`);
});
