const express = require("express");
const path = require("path");

const submitRouter = require('../routes/server/submit');
const entradasRouter = require('../routes/server/entradas');
const centralesRouter = require('../routes/server/centrales');

const app = express();

// Configuração CORS manual
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://nandartart.art");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter);

// Static + fallback
app.use(express.static(path.join(__dirname, '../../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Início do servidor
app.listen(3000, () => console.log("Servidor na porta 3000"));
