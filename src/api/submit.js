import { NFTStorage, File } from 'nft.storage';

const API_KEY = '180701d8.ce23c12a267a4343be72fdd645f7e0be';
const client = new NFTStorage({ token: API_KEY });

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("artwork-form");
  const errorEl = document.getElementById("submission-error");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";

    const artist = document.getElementById("artist-name").value.trim();
    const title = document.getElementById("art-title").value.trim();
    const year = document.getElementById("art-year").value.trim();
    const price = document.getElementById("art-price").value.trim();
    const imageFile = document.getElementById("art-image").files[0];
    const preference = document.getElementById("highlight").value;

    if (!artist || !title || !year || !price || !imageFile) {
      errorEl.textContent = "Please fill out all fields.";
      errorEl.style.display = "block";
      return;
    }

    try {
      // Upload da imagem para IPFS
      const imageCid = await client.storeBlob(imageFile);
      const imageUrl = `ipfs://${imageCid}/${imageFile.name}`;

      // Criar metadados
      const metadata = {
        name: title,
        description: `${title} by ${artist}, ${year}.`,
        image: imageUrl,
        attributes: [
          { trait_type: "Artist", value: artist },
          { trait_type: "Year", value: year },
          { trait_type: "Technique", value: "Mixed" },
          { trait_type: "Display", value: preference }
        ]
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const jsonCid = await client.storeBlob(metadataBlob);
      const tokenURI = `ipfs://${jsonCid}/metadata.json`;

      // Guardar localmente
      const stored = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");
      stored.push({ artist, title, year, price, preference, tokenURI, image: imageUrl });
      localStorage.setItem("pendingSubmissions", JSON.stringify(stored));

      // Tentar enviar para backend
      const backendForm = new FormData();
      backendForm.append('artistName', artist);
      backendForm.append('artTitle', title);
      backendForm.append('artYear', year);
      backendForm.append('artPrice', price);
      backendForm.append('highlight', preference);
      backendForm.append('artImage', imageFile);

      try {
        const res = await fetch("https://nandart-api.onrender.com/api/submit-artwork", {
          method: "POST",
          body: backendForm
        });

        if (!res.ok) throw new Error("Erro ao enviar para backend");

        alert("Obra submetida com sucesso. Está agora à espera de aprovação curatorial.");
      } catch (err) {
        console.warn("Submissão local feita, mas não enviada ao backend:", err);
        alert("Obra submetida para IPFS e guardada localmente. No entanto, não foi possível contactar o sistema de curadoria. Por favor verifica a ligação ou tenta mais tarde.");
      }

      form.reset();
    } catch (err) {
      console.error(err);
      errorEl.textContent = "A submissão falhou. Por favor tenta novamente.";
      errorEl.style.display = "block";
    }
  });
});
