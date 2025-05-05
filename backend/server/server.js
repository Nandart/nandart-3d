const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// Configuração das credenciais de administrador
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "meu-usuario-admin",
  password: process.env.ADMIN_PASSWORD || "minha-senha-segura",
};

// Chave secreta para assinar o token JWT
const JWT_SECRET = process.env.JWT_SECRET || "minha-chave-secreta";

// Rota para login de administrador
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;

  // Verifique as credenciais
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    // Gere um token JWT
    const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
      expiresIn: "1h", // O token expira em 1 hora
    });

    return res.json({ token });
  } else {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
});

// Rota para verificar o token
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

// Iniciar o servidor (exemplo)
app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
