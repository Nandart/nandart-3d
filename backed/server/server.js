const express = require("express");
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
  credentials: true,
  optionsSuccessStatus: 200 // Para navegadores mais antigos
};

// Aplicar CORS antes de outras middlewares
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
});
