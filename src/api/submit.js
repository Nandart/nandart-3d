// src/api/submit.js
const backendURL = 'https://nandart-3d.onrender.com/api/submit-artwork';

document.getElementById("artwork-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const errorEl = document.getElementById("submission-error");
  errorEl.style.display = "none";

  const formData = new FormData(form);

  try {
    const response = await fetch(backendURL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }

    alert("Your artwork has been submitted successfully!");
    form.reset();
  } catch (err) {
    console.error("Erro ao submeter:", err);
    errorEl.style.display = "block";
  }
});
