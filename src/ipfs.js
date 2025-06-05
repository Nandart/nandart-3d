
import { NFTStorage, File } from 'nft.storage';

const API_KEY = '180701d8.ce23c12a267a4343be72fdd645f7e0be';
const client = new NFTStorage({ token: API_KEY });

document.getElementById("artworkForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const artist = document.getElementById("artist").value.trim();
  const title = document.getElementById("title").value.trim();
  const year = document.getElementById("year").value.trim();
  const technique = document.getElementById("technique").value.trim();
  const price = document.getElementById("price").value.trim();
  const imageFile = document.getElementById("image").files[0];

  if (!imageFile) {
    alert("Please select an image.");
    return;
  }

  try {
    // Upload image to IPFS
    const imageCid = await client.storeBlob(imageFile);
    const imageUrl = `ipfs://${imageCid}/${imageFile.name}`;

    // Create metadata JSON
    const metadata = {
      name: title,
      description: `${title} by ${artist}, created in ${year}. Medium: ${technique}.`,
      image: imageUrl,
      attributes: [
        { trait_type: "Artist", value: artist },
        { trait_type: "Year", value: year },
        { trait_type: "Technique", value: technique },
        { trait_type: "Price", value: price }
      ]
    };

    const jsonBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const jsonCid = await client.storeBlob(jsonBlob);
    const tokenURI = `ipfs://${jsonCid}/metadata.json`;

    document.getElementById("result").style.display = "block";
    document.getElementById("tokenURI").textContent = tokenURI;
  } catch (err) {
    console.error("Error uploading to IPFS:", err);
    alert("Failed to upload artwork to IPFS.");
  }
});
