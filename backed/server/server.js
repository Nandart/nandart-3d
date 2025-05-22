const express = require("express");
const path = require("path");

const submitRouter = require('../routes/server/submit');
const entradasRouter = require('../routes/server/entradas');
const centralesRouter = require('../routes/server/centrales');

const app = express();

// Configuração CORS com pré-voo
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://nandartart.art");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas principais
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter);

// Rota de health check para Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Conteúdo estático + fallback
app.use(express.static(path.join(__dirname, '../../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Inicialização
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


