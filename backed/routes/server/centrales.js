const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const FICHEIRO = path.join(__dirname, '../centrales.json');

function ler() {
  try {
    const dados = fs.readFileSync(FICHEIRO);
    return JSON.parse(dados);
  } catch {
    return {};
  }
}

function gravar(dados) {
  fs.writeFileSync(FICHEIRO, JSON.stringify(dados, null, 2));
}

// POST /api/centrales — regista entrada no círculo
router.post('/', (req, res) => {
  const { obraId } = req.body;
  if (!obraId) return res.status(400).json({ erro: 'obraId em falta' });

  const dados = ler();
  if (!dados[obraId]) {
    dados[obraId] = Date.now();
    gravar(dados);
  }

  res.json({ obraId, data: dados[obraId] });
});

// GET /api/centrales/:obraId — consulta data
router.get('/:obraId', (req, res) => {
  const dados = ler();
  const data = dados[req.params.obraId];
  if (!data) return res.status(404).json({ erro: 'Não encontrado' });

  res.json({ obraId: req.params.obraId, data });
});

// DELETE /api/centrales/:obraId — remove
router.delete('/:obraId', (req, res) => {
  const dados = ler();
  if (dados[req.params.obraId]) {
    delete dados[req.params.obraId];
    gravar(dados);
    return res.json({ removido: req.params.obraId });
  }
  res.status(404).json({ erro: 'Não encontrado' });
});

module.exports = router;
