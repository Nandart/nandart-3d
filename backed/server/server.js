const express = require("express");
const cors = require("cors");
const path = require("path");

const submitRouter = require('./routes/submit');
const entradasRouter = require('./routes/entradas');
const centralesRouter = require('./routes/centrales'); // <-- AQUI

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', submitRouter);
app.use('/api/entradas', entradasRouter);
app.use('/api/centrales', centralesRouter); // <-- AQUI

// Static + fallback
app.use(express.static(path.join(__dirname, '../../')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Início do servidor
app.listen(3000, () => console.log("Servidor na porta 3000"));

function lerEntradas() {
  try {
    const dados = fs.readFileSync(FICHEIRO);
    return JSON.parse(dados);
  } catch {
    return {};
  }
}

function guardarEntradas(dados) {
  fs.writeFileSync(FICHEIRO, JSON.stringify(dados, null, 2));
}

// POST /api/entradas — regista a data de entrada da obra
router.post('/', (req, res) => {
  const { obraId } = req.body;
  if (!obraId) return res.status(400).json({ erro: 'obraId em falta' });

  const entradas = lerEntradas();
  if (!entradas[obraId]) {
    entradas[obraId] = Date.now();
    guardarEntradas(entradas);
  }

  res.json({ obraId, data: entradas[obraId] });
});

// GET /api/entradas/:obraId — consulta a data
router.get('/:obraId', (req, res) => {
  const entradas = lerEntradas();
  const data = entradas[req.params.obraId];
  if (!data) return res.status(404).json({ erro: 'Não encontrado' });

  res.json({ obraId: req.params.obraId, data });
});

// DELETE /api/entradas/:obraId — remove o registo
router.delete('/:obraId', (req, res) => {
  const entradas = lerEntradas();
  if (entradas[req.params.obraId]) {
    delete entradas[req.params.obraId];
    guardarEntradas(entradas);
    return res.json({ removido: req.params.obraId });
  }
  res.status(404).json({ erro: 'Não encontrado' });
});

module.exports = router;
