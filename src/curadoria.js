import { getContrato } from './contrato.js';

async function carregarSubmissoes() {
  const lista = document.getElementById("curadoria-lista");
  lista.innerHTML = "";

  const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
  const user = contas[0];
  const contrato = await getContrato();
  const autorizado = await contrato.isWhitelisted(user);

  if (!autorizado) {
    lista.innerHTML = "<p style='color: orange;'>Access restricted to curators only.</p>";
    return;
  }

  const obras = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");

  if (obras.length === 0) {
    lista.innerHTML = "<p style='color: grey;'>No submissions pending approval.</p>";
    return;
  }

  obras.forEach((obra, index) => {
    const div = document.createElement("div");
    div.className = "obra-card";
    div.innerHTML = `
      <img src="${obra.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}" alt="${obra.title}" style="max-width: 100%; border-radius: 4px;" />
      <h3>${obra.title}</h3>
      <p><strong>Artist:</strong> ${obra.artist}</p>
      <p><strong>Year:</strong> ${obra.year}</p>
      <p><strong>Display:</strong> ${obra.preference}</p>
      <p><strong>Price:</strong> ${obra.price} ETH</p>
      <button data-index="${index}" class="approve">Approve & Mint</button>
      <button data-index="${index}" class="reject">Reject</button>
    `;
    lista.appendChild(div);
  });

  document.querySelectorAll(".approve").forEach(btn =>
    btn.onclick = async () => {
      const i = btn.dataset.index;
      const obra = obras[i];
      try {
        const valor = ethers.parseEther(obra.price.toString());
        const tx = await contrato.mintComCuradoria(user, obra.tokenURI, { value: valor });
        console.log("Minted:", tx);
        alert("NFT minted successfully.");
        obras.splice(i, 1);
        localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
        carregarSubmissoes();
      } catch (err) {
        console.error(err);
        alert("Error during minting.");
      }
    }
  );

  document.querySelectorAll(".reject").forEach(btn =>
    btn.onclick = () => {
      const i = btn.dataset.index;
      obras.splice(i, 1);
      localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
      carregarSubmissoes();
    }
  );
}

document.addEventListener("DOMContentLoaded", carregarSubmissoes);
