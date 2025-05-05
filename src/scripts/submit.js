document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submit-form");
  const statusEl = document.getElementById("status");
  const tokenParam = new URLSearchParams(window.location.search).get("token");

  const cloudinaryUrl = process.env.CLOUDINARY_URL || "https://api.cloudinary.com/v1_1/dld2sejas/image/upload";
  const uploadPreset = process.env.CLOUDINARY_PRESET || "nandart_public";
  const apiUrl = process.env.API_URL || "http://localhost:3000";

  async function verifyAdmin(token) {
    const res = await fetch(`${apiUrl}/api/verify-admin?token=${token}`);
    return res.ok;
  }

  if (tokenParam) {
    verifyAdmin(tokenParam).then((isAdmin) => {
      if (isAdmin) {
        const adminButton = document.getElementById("admin-button");
        if (adminButton) adminButton.style.display = "inline-block";
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.innerHTML = "<div class='loader'></div> Submitting...";
    statusEl.style.color = "white";

    const formData = new FormData(form);
    const imageFile = formData.get("image");

    const requiredFields = [
      "title", "artist", "year", "description", "location", "style",
      "technique", "dimensions", "materials"
    ];

    for (const field of requiredFields) {
      if (!formData.get(field) || formData.get(field).trim() === "") {
        statusEl.textContent = `Por favor, preencha o campo "${field}".`;
        statusEl.style.color = "orange";
        document.querySelector(`[name="${field}"]`).style.border = "1px solid orange";
        return;
      }
    }

    if (!imageFile || imageFile.size === 0) {
      statusEl.textContent = "Por favor, faça o upload de uma imagem.";
      statusEl.style.color = "orange";
      return;
    }

    try {
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

      const apiRes = await fetch(`${apiUrl}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      if (!apiRes.ok) {
        const error = await apiRes.json();
        throw new Error(`Falha na submissão: ${error.message || "Erro desconhecido"}`);
      }

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
