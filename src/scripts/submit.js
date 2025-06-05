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
      // Upload image to IPFS
      const imageCid = await client.storeBlob(imageFile);
      const imageUrl = `ipfs://${imageCid}/${imageFile.name}`;

      // Create metadata JSON
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

      // Store submission locally for curators
      const stored = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");
      stored.push({ artist, title, year, price, preference, tokenURI, image: imageUrl });
      localStorage.setItem("pendingSubmissions", JSON.stringify(stored));

      alert("Artwork submitted successfully and awaits curatorial approval.");
      form.reset();
    } catch (err) {
      console.error(err);
      errorEl.textContent = "Submission failed. Please try again.";
      errorEl.style.display = "block";
    }
  });
});
