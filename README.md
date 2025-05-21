# NANdART 3D Gallery — README Técnico

## ✨ Visão Geral

A galeria **NANdART** é um santuário artístico tridimensional onde obras de arte digitais flutuam num espaço etéreo. Com base em tecnologias modernas como **Three.js**, **Vite**, **ethers.js** e integração **Web3**, esta galeria apresenta uma experiência visual e emocional única, fiel a um layout artístico original.

## 🧱 Tecnologias Utilizadas

- [Three.js](https://threejs.org/) — renderização 3D em WebGL.
- [GSAP](https://greensock.com/gsap/) — animações fluidas e desacelerações.
- [Ethers.js](https://docs.ethers.org/) — ligação à carteira MetaMask e envio de ETH.
- [Express.js](https://expressjs.com/) — backend Node para migração e curadoria.
- [JWT](https://jwt.io/) — segurança de acesso ao painel de curadoria.
- [NFT.Storage](https://nft.storage/) — (em preparação) para alojamento descentralizado.

## 🎨 Funcionalidades Visuais

- Círculo central com **obras circulantes suspensas**.
- Cubos translúcidos com gemas e obras em **pré-venda**.
- Paredes com textura **antracite realista** e frisos dourados embutidos.
- Obra central em destaque com moldura e painel informativo.
- Pedestais com vitrines e iluminação controlada.
- Círculo de luz no chão com reflexo suave.

## 🔄 Lógica de Curadoria Automatizada

Cada obra que entra num cubo suspenso segue o seguinte fluxo:

1. **Fase Suspensa** — permanece 30 dias num cubo translúcido.
2. **Fase Central** — se não vendida, migra para o círculo central durante 14 dias.
3. **Arquivamento** — se continuar sem venda, é arquivada pelo backend.
4. A entrada é registada com `Date.now()` no backend Express.

## 🧪 Como Executar Localmente

### Backend

```bash
cd backend/server
npm install
node server.js
```

Certifica-te que tens o ficheiro `.env` com:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=segredo
JWT_SECRET=chave-secreta
```

### Frontend

```bash
cd nandart-3d
npm install
npm run dev
```

Acede a `http://localhost:5173` no browser.

## 📂 Estrutura de Ficheiros

```
nandart-3d/
├── index.html
├── main.js
├── data/
│   └── obras-suspensas.js
├── assets/
│   ├── antracite-realista.jpg
│   └── obras/
│       ├── obra1.jpg
│       └── ...
├── backend/
│   └── server/
│       ├── server.js
│       ├── routes/
│       │   └── entradas.js
│       └── entradas.json
```

## 💎 Frase Final

> _"No silêncio da luz e do vidro, cada obra espera ser tocada pela eternidade. A galeria NANdART não é apenas código — é um sopro de alma digital em suspensão."_