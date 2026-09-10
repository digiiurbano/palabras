require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DB = require('./database.js');
const { isPostgresConfigured } = require('./db/pool');

const app = express();

// CORS: permite localhost en dev, la URL de Vercel en producción y previsualizaciones *.vercel.app
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // ej: https://jn-palabras.vercel.app
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sin origin (ej: Postman, curl, movil)
    if (!origin) return callback(null, true);
    
    // Permite orígenes en la lista explícita
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Permite subdominios de previsualización de Vercel (*.vercel.app)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);

    return callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Endpoint de estado del sistema y BD
app.get('/api/health', async (req, res) => {
  const pgActive = isPostgresConfigured();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      type: pgActive ? 'PostgreSQL' : 'In-Memory (Mock / Local Fallback)',
      active: true
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

app.get('/api/users/:id', async (req, res) => {
  try {
    const usuario = await DB.findUsuarioById(req.params.id);
    if (usuario) res.json(usuario);
    else res.status(404).json({ error: 'No encontrado' });
  } catch (err) {
    console.error('Error en /api/users/:id:', err.message);
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
