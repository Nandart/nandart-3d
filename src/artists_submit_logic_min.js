document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("artForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const image = document.getElementById("image").files[0];
    const title = document.getElementById("title").value;
    const year = document.getElementById("year").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value;
    const highlight = document.getElementById("highlight").checked ? "Sim" : "Não";
    const artistName = document.getElementById("artistName").value;
    const wallet = document.getElementById("wallet").value;

    if (!image || !title || !year || !price || !artistName || !wallet) {
      alert("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("year", year);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("highlight", highlight);
    formData.append("artistName", artistName);
    formData.append("wallet", wallet);

    try {
      const response = await fetch("https://teu-servidor.onrender.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        alert("Obra submetida com sucesso! 🎨\n" + (result.tokenURI || ""));
        form.reset();
      } else {
        throw new Error(result.error || "Erro desconhecido.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao submeter a obra: " + err.message);
    }
  });
});