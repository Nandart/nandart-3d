// src/api/submit.js

const backendURL = 'https://nandart-3d.onrender.com/api/submit-artwork';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("artwork-form");
  const errorEl = document.getElementById("submission-error");

  if (!form) {
    console.error("❌ Formulário artwork-form não encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";

    const formData = new FormData(form);
    console.log("📤 Submissão iniciada...");

    try {
      const response = await fetch(backendURL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }

      console.log("🎉 Submissão completa.");
      window.location.href = "/thanks.html";
    } catch (err) {
      console.error("❌ Erro ao submeter:", err);
      errorEl.style.display = "block";
      alert("⚠️ Submission failed. Please try again or contact us.");
    }
  });
});
