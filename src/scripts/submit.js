document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("submit-form");
  const statusEl = document.getElementById("status");
  const adminButton = document.getElementById("admin-button");

  // URLs configuráveis via variáveis de ambiente ou valores padrão
  const cloudinaryUrl = process.env.CLOUDINARY_URL || "https://api.cloudinary.com/v1_1/dld2sejas/image/upload";
  const uploadPreset = process.env.CLOUDINARY_PRESET || "nandart_public";
  const apiUrl = process.env.API_URL || "http://localhost:3000";

  // Função para verificar se o usuário é administrador
  async function verifyAdmin(token) {
    try {
      const res = await fetch(`${apiUrl}/api/verify-admin`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Token armazenado localmente
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.isAdmin;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar administrador:", error);
      return false;
    }
  }

  // Exibir botão de administrador se o usuário for autenticado como admin
  const tokenParam = localStorage.getItem("adminToken");
  if (tokenParam) {
    const isAdmin = await verifyAdmin(tokenParam);
    if (isAdmin) {
      adminButton.style.display = "inline-block";
    }
  }

  // Adicionar evento de submissão ao formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Mostrar o status de envio com um indicador visual
    statusEl.innerHTML = "<div class='loader'></div> Submetendo...";
    statusEl.style.color = "white";

    const formData = new FormData(form);
    const imageFile = formData.get("image");

    // Campos obrigatórios para validação
    const requiredFields = [
      "title", "artist", "year", "description", "location", "style",
      "technique", "dimensions", "materials",
    ];

    // Validação de campos obrigatórios
    for (const field of requiredFields) {
      if (!formData.get(field) || formData.get(field).trim() === "") {
        statusEl.textContent = `Por favor, preencha o campo "${field}".`;
        statusEl.style.color = "orange";
        document.querySelector(`[name="${field}"]`).style.border = "1px solid orange";
        return;
      }
    }

    // Verificar se o arquivo de imagem foi enviado
    if (!imageFile || imageFile.size === 0) {
      statusEl.textContent = "Por favor, faça o upload de uma imagem.";
      statusEl.style.color = "orange";
      return;
    }

    try {
      // Upload da imagem para o Cloudinary
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", imageFile);
      cloudinaryData.append("upload_preset", uploadPreset);

      const cloudinaryRes = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudinaryData,
      });

      const cloudinaryJson = await cloudinaryRes.json();

      if (!cloudinaryJson.secure_url) {
        throw new Error("Falha no upload da imagem. Verifique sua conexão.");
      }

      // Preparar os dados para envio ao backend
      const submissionPayload = {
        title: formData.get("title"),
        artist: formData.get("artist"),
        year: formData.get("year"),
        description: formData.get("description"),
        location: formData.get("location"),
        style: formData.get("style"),
        technique: formData.get("technique"),
        dimensions: formData.get("dimensions"),
        materials: formData.get("materials"),
        imageUrl: cloudinaryJson.secure_url,
      };

      // Enviar os dados ao backend
      const apiRes = await fetch(`${apiUrl}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      if (!apiRes.ok) {
        const error = await apiRes.json();
        throw new Error(`Falha na submissão: ${error.message || "Erro desconhecido"}`);
      }

      // Submissão bem-sucedida
      statusEl.textContent = "Obra submetida com sucesso!";
      statusEl.style.color = "lightgreen";
      form.reset();

    } catch (err) {
      console.error(err);
      statusEl.textContent = "Ocorreu um erro durante a submissão.";
      statusEl.style.color = "red";
    }
  });
});
