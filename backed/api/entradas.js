const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const ficheiro = path.join(__dirname, '../entradas.json');

// Lê o ficheiro JSON actual
function lerEntradas() {
  if (!fs.existsSync(ficheiro)) return {};
  return JSON.parse(fs.readFileSync(ficheiro, 'utf8') || '{}');
}

// Escreve no ficheiro JSON
function gravarEntradas(dados) {
  fs.writeFileSync(ficheiro, JSON.stringify(dados, null, 2));
}

// POST /api/entradas → registar entrada
router.post('/', (req, res) => {
  const { obraId } = req.body;
  if (!obraId) return res.status(400).json({ erro: 'obraId em falta' });

  const entradas = lerEntradas();
  entradas[obraId] = Date.now();
  gravarEntradas(entradas);

  res.json({ data: entradas[obraId] });
});

// GET /api/entradas/:id → obter timestamp da entrada
router.get('/:id', (req, res) => {
  const entradas = lerEntradas();
  const id = req.params.id;

  if (!entradas[id]) return res.status(404).json({ erro: 'obra não registada' });

  res.json({ data: entradas[id] });
});

// DELETE /api/entradas/:id → remover entrada após migração
router.delete('/:id', (req, res) => {
  const entradas = lerEntradas();
  const id = req.params.id;

  if (!entradas[id]) return res.status(404).json({ erro: 'obra não registada' });

  delete entradas[id];
  gravarEntradas(entradas);

  res.json({ mensagem: 'Entrada removida com sucesso' });
});

module.exports = router;
