const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const path = require("path");
const submitRouter = require("./submit");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Servir o frontend estático da pasta /public (fora da pasta /backed)
app.use(express.static(path.join(__dirname, "../../public")));

// 2. Integrar a rota de submissão de obras
app.use("/api", submitRouter);

// 3. Credenciais de administrador e JWT
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "meu-usuario-admin",
  password: process.env.ADMIN_PASSWORD || "minha-senha-segura",
};
const JWT_SECRET = process.env.JWT_SECRET || "minha-chave-secreta";

// 4. Limitar tentativas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite por IP
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Rota para login de administrador
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

// 6. Verificação de token JWT para acesso administrativo
app.get("/api/verify-admin", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ isAdmin: false });

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

// 7. Redirecionar todas as rotas desconhecidas para index.html (SPA ou fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

// 8. Iniciar o servidor na porta 3000
app.listen(3000, () => {
  console.log("Servidor da NANdART a correr em http://localhost:3000");
});