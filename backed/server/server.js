const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const path = require("path");
const submitRouter = require('./routes/submit');

const app = express();

// 1. Ativar CORS apenas para o domínio do frontend
app.use(cors({
  origin: 'https://nandartart.art',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Middleware de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Servir ficheiros estáticos diretamente da raiz do projeto
app.use(express.static(path.join(__dirname, '../../'))); // NOTA: estamos em /backed/server

// 4. Servir o index.html para rotas diretas como /terms.html, /artists.html, etc.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// 5. Rotas de submissão
app.use('/api', submitRouter);

// 6. Credenciais de admin (usadas no login)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "meu-usuario-admin",
  password: process.env.ADMIN_PASSWORD || "minha-senha-segura",
};

const JWT_SECRET = process.env.JWT_SECRET || "minha-chave-secreta";

// 7. Limite de tentativas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Muitas tentativas de login. Tente novamente após 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 8. Endpoint de login
app.post("/api/admin-login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token });
  } else {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
});

// 9. Verificação do token JWT
app.get("/api/verify-admin", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ isAdmin: false });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === "admin") {
      return res.json({ isAdmin: true });
    } else {
      return res.status(403).json({ isAdmin: false });
    }
  } catch (err) {
    return res.status(403).json({ isAdmin: false });
  }
});

// 10. Iniciar o servidor
app.listen(3000, () => console.log("Servidor rodando na porta 3000"));