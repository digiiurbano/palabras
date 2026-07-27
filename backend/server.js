const express = require('express');
const cors = require('cors');
const DB = require('./database.js');

const app = express();

// CORS: permite localhost en dev y la URL de Vercel en producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // ej: https://jn-palabras.vercel.app
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sin origin (ej: Postman, curl) y los orígenes permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para origen: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());


// Auth
app.post('/api/auth/login', (req, res) => {
  const { correo, contrasena } = req.body;
  const usuario = DB.validarLogin(correo, contrasena);
  if (usuario) {
    res.json(usuario);
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.get('/api/users/:id', (req, res) => {
  const usuario = DB.getUsuario(req.params.id);
  if (usuario) res.json(usuario);
  else res.status(404).json({ error: 'No encontrado' });
});

// Since the old frontend relied on a local DB object, the simplest MVP refactor 
// is to expose endpoints that act like the old DB methods, or just fetch the whole state 
// and update it for now, since it's just a mock.
app.get('/api/db', (req, res) => {
  res.json(DB.get());
});

app.post('/api/db', (req, res) => {
  DB.save(req.body);
  res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
  DB.reset();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
