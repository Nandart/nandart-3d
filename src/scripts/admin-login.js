document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("admin-login-form");
  const adminButton = document.getElementById("admin-button");
  const logoutButton = document.getElementById("logout-button");

  // Ativar o formulário de login com uma combinação de teclas (Ctrl + L)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "l") { // Ctrl + L
      loginForm.style.display = "block";
    }
  });

  // Lógica para o login de administrador
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;
    const loginStatusEl = document.getElementById("login-status");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Falha no login. Verifique suas credenciais.");
      }

      const data = await res.json();
      localStorage.setItem("adminToken", data.token); // Armazena o token no localStorage
      loginStatusEl.textContent = "Login bem-sucedido!";
      loginStatusEl.style.color = "green";

      // Ocultar o formulário de login e exibir os botões de administrador e logout
      loginForm.style.display = "none";
      adminButton.style.display = "block";
      logoutButton.style.display = "block";
    } catch (err) {
      console.error(err);
      loginStatusEl.textContent = "Erro: " + err.message;
      loginStatusEl.style.color = "red";
    }
  });

  // Lógica para o logout
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("adminToken"); // Remove o token de autenticação
    alert("Você foi desconectado!");
    adminButton.style.display = "none"; // Esconde o botão de administrador
    logoutButton.style.display = "none"; // Esconde o botão de logout
    location.reload(); // Recarrega a página
  });
});
