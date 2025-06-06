const express = require("express");
const cors = require("cors");
const path = require("path");

const submitRouter = require('./routes/server/submit');
const entradasRouter = require('./routes/server/entradas');
const centralesRouter = require('./routes/server/centrales');

const app = express();

// ✅ CORS configurado de forma segura e moderna
app.use(cors({
  origin: 'https://nandartart.art',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ✅ Middleware para interpretar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rotas da API
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter);

// ✅ Health check para Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ✅ Servir ficheiros estáticos e fallback para SPA
app.use(express.static(path.join(__dirname, '../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ✅ Iniciar o servidor na porta definida
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});

