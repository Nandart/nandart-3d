const express = require("express");
const cors = require("cors");
const path = require("path");

const submitRouter = require('./routes/server/submit');
const entradasRouter = require('./routes/server/entradas'); // ✅ agora apontado correctamente
const centralesRouter = require('./routes/server/centrales');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);  // ⬅ isto ativa os endpoints POST, GET, DELETE
app.use('/api/centrales', centralesRouter);

// Static + fallback
app.use(express.static(path.join(__dirname, '../../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Início do servidor
app.listen(3000, () => console.log("Servidor na porta 3000"));
