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

      alert("✅ Your artwork has been submitted successfully!");
      console.log("🎉 Submissão completa.");
      form.reset();
    } catch (err) {
      console.error("❌ Erro ao submeter:", err);
      errorEl.style.display = "block";
      alert("⚠️ Submission failed. Please try again or contact us.");
    }
  });
});
