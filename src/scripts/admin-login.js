document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("login-status");
  const username = e.target.username.value;
  const password = e.target.password.value;

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
    statusEl.textContent = "Login bem-sucedido!";
    statusEl.style.color = "green";

    // Opcional: redirecionar ou atualizar a página
    location.reload();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Erro: " + err.message;
    statusEl.style.color = "red";
  }
});
