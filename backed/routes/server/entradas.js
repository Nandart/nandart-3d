const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const FICHEIRO = path.join(__dirname, '../entradas.json');

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
