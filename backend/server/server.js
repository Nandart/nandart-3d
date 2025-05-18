const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const submitRouter = require('./submit'); // <- Adicionado

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Integrar a rota de submissão
app.use('/api', submitRouter); // <- Adicionado

const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "meu-usuario-admin",
  password: process.env.ADMIN_PASSWORD || "minha-senha-segura",
};

const JWT_SECRET = process.env.JWT_SECRET || "minha-chave-secreta";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Muitas tentativas de login. Tente novamente após 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Iniciar o servidor
app.listen(3000, () => console.log("Servidor rodando na porta 3000"));