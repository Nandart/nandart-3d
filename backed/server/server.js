const express = require("express");
const cors = require("cors");
const path = require("path");

// Routers
const submitRouter = require('./routes/server/submit');
const entradasRouter = require('./routes/server/entradas');
const centralesRouter = require('./routes/server/centrales');

const app = express();

// ================== CONFIGURAÇÃO DE CORS ==================
const cors = require("cors");

const corsOptions = {
  origin: "https://nandartart.art",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// ================== PARSERS DE REQUEST ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== ROTAS PRINCIPAIS ==================
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter);

// ================== FICHEIROS ESTÁTICOS E FALLBACK ==================
app.use(express.static(path.join(__dirname, '../../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// ================== INÍCIO DO SERVIDOR ==================
app.listen(3000, () => {
  console.log("🚀 Servidor iniciado na porta 3000");
});
