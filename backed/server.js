const express = require("express");
const cors = require("cors");
const path = require("path");

const submitRouter = require('./routes/server/submit');
const entradasRouter = require('./routes/server/entradas');
const centralesRouter = require('./routes/server/centrales');

const app = express();

const allowedOrigins = ['https://nandartart.art'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl etc.

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'O domínio não está autorizado pela política CORS';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Middleware para interpretar JSON e urlencoded — cuidado para não conflitar com multer
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar as rotas da API
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter);

// Health check para Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Servir ficheiros estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Fallback para SPA: entrega o index.html para todas as rotas não encontradas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});
