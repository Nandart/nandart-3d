 🖼️ NANdART — 3D Curated Art Gallery with Web3 Integration

**NANdART** is a curated, immersive 3D gallery where submitted artworks can become NFTs and live on-chain. Artists are invited to submit their pieces through a public form. Each submission is reviewed and, upon approval, is published and integrated into the gallery.

> 🔒 This is a curated Web3 project — submissions are reviewed before becoming part of the official collection.

---

## 🔧 Features

- Interactive 3D gallery experience (fully touch-compatible)
- Artwork submission via public form
- Image upload to Cloudinary
- Automatic issue creation on GitHub for each submission
- Token-protected approval panel (`?token=nandartpower`)
- Pull Request generation for approved artworks
- Ready for NFT integration via Polygon + NFT.Storage (in development)

---

## 📁 Project Structure

nandart-3d/
│
├── api/
│ ├── submit.js # Receives submission, creates GitHub issue
│ ├── aprovar.js # Creates PR with approved artwork
│ └── submissoes.js # Fetches pending submissions
│
├── obras-aprovadas/
│ └── .gitkeep # Placeholder for approved artworks
│
├── src/
│ ├── scripts/
│ │ └── submit.js # Handles form submission and Cloudinary upload
│ └── styles/
│ └── index.css # Shared styles
│
├── submeter.html # Public submission form (in English)
├── painel-aprovacao.html # Admin approval panel (requires token)
├── index.html # 3D gallery homepage (in progress)
├── package.json # Project dependencies
├── vite.config.js # Vite configuration
└── README.md # This file

yaml
Copiar
Editar

---

## 🌐 Environment Variables (Vercel)

| Variable         | Description                                |
|------------------|--------------------------------------------|
| `GITHUB_TOKEN`   | GitHub personal access token with `repo` scope |
| `NODE_ENV`       | Should be `production`                    |

---

## 🔐 Admin Access

To access the approval panel:

https://your-domain.vercel.app/painel-aprovacao.html?token=nandartpower

yaml
Copiar
Editar

Only complete and valid submissions will be listed.

---

## 📸 Image Upload via Cloudinary

- **Cloud name**: `dld2sejas`
- **Upload preset**: `nandart_public`
- Uploads are unsigned and public.

---

## 🚀 Deployment

This project is deployed via [Vercel](https://vercel.com/).  
All files inside `/api/` are serverless endpoints.

---

## 🧠 Roadmap

- ✅ Image hosting (Cloudinary)
- ✅ GitHub-based curation flow
- ✅ PR generation from admin panel
- 🔜 NFT minting with NFT.Storage + Polygon
- 🔜 Wallet integration for collectors
- 🔜 Touch-optimised 3D experience with modal artworks

---

## 👤 Credits

Built with artistic vision and technical precision by [@Nandart](https://github.com/Nandart), in honour of personal legacy, resilience and the transformative power of visual expression.

---

## 🖖 License

MIT License — open for learning, adaptation and respectful collaboration.
