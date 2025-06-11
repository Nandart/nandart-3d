
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contractAddress = "0xeAA6711D4d6604Aeb134aa90bE7a7439aE473440";

async function loadNFTs() {
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const abi = await fetch("NandartNFT_ABI.json").then(res => res.json());
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const total = await contract.totalSupply();
  const container = document.getElementById("artContainer");
  container.innerHTML = "";

  for (let i = 0; i < total; i++) {
    try {
      const tokenURI = await contract.tokenURI(i);
      const ipfsURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      const metadata = await fetch(ipfsURL).then(r => r.json());

      if (metadata.premium === false || metadata.premium === "false") {
        const card = document.createElement("div");
        card.className = "art-card";
        card.setAttribute("data-artist", metadata.artist || "Unknown");

        card.innerHTML = `
          <img src="${(metadata.image || '').replace("ipfs://", "https://ipfs.io/ipfs/")}" alt="${metadata.title}">
          <h3>${metadata.artist}</h3>
          <p>${metadata.title} – ${metadata.year}</p>
        `;

        container.appendChild(card);
      }
    } catch (err) {
      console.error("Erro ao processar tokenId", i, err);
    }
  }
}

window.addEventListener("load", loadNFTs);
