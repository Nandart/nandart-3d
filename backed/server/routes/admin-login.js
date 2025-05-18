document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("admin-login-form");
  const adminButton = document.getElementById("admin-button");
  const logoutButton = document.getElementById("logout-button");
  const loginStatusEl = document.getElementById("login-status");

  // Mostrar formulário com Ctrl + L
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      loginForm.style.display = "block";
    }
  });

  // Tentar login ao submeter
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();

    if (!username || !password) {
      loginStatusEl.textContent = "Por favor, preencha todos os campos.";
      loginStatusEl.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        loginStatusEl.textContent = data.message || "Credenciais inválidas.";
        loginStatusEl.style.color = "red";
        return;
      }

      // Guardar token
      localStorage.setItem("adminToken", data.token);

      loginStatusEl.textContent = "Login bem-sucedido!";
      loginStatusEl.style.color = "green";

      loginForm.style.display = "none";
      adminButton.style.display = "inline-block";
      logoutButton.style.display = "inline-block";
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      loginStatusEl.textContent = "Erro de rede ou servidor.";
      loginStatusEl.style.color = "red";
    }
  });

  // Logout
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    adminButton.style.display = "none";
    logoutButton.style.display = "none";
    alert("Sessão terminada com sucesso.");
    location.reload();
  });

  // Verificar se já existe token
  const existingToken = localStorage.getItem("adminToken");
  if (existingToken) {
    fetch("/api/verify-admin", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${existingToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAdmin) {
          adminButton.style.display = "inline-block";
          logoutButton.style.display = "inline-block";
        } else {
          localStorage.removeItem("adminToken");
        }
      })
      .catch(() => {
        localStorage.removeItem("adminToken");
      });
  }
});