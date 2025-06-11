
import { ethers } from "ethers";

const contractAddress = "0xeAA6711D4d6604Aeb134aa90bE7a7439aE473440";
const provider = new ethers.BrowserProvider(window.ethereum);

async function loadPremiumNFTs() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const signer = await provider.getSigner();
  const abi = await fetch("/NandartNFT_ABI.json").then(res => res.json());
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const total = await contract.totalSupply();
  const circle = document.getElementById("premium-circle");
  if (!circle) return;

  for (let i = 0; i < total; i++) {
    try {
      const uri = await contract.tokenURI(i);
      const metadataURL = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      const metadata = await fetch(metadataURL).then(r => r.json());

      if (metadata.premium === true || metadata.premium === "true") {
        const art = document.createElement("div");
        art.className = "floating-art";
        art.innerHTML = `
          <img src="${(metadata.image || '').replace("ipfs://", "https://ipfs.io/ipfs/")}" alt="${metadata.title}" />
        `;
        circle.appendChild(art);
      }
    } catch (e) {
      console.error("Erro ao carregar tokenId", i, e);
    }
  }
}

window.addEventListener("DOMContentLoaded", loadPremiumNFTs);
