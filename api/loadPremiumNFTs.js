import { ethers } from "ethers";

const contractAddress = "0xeAA6711D4d6604Aeb134aa90bE7a7439aE473440";
const provider = new ethers.BrowserProvider(window.ethereum);

async function loadPremiumNFTs() {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();
    const abi = await fetch("./abi/NandartNFT_ABI.json").then(res => res.json());
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Note: Your ABI doesn't show a 'totalSupply' function, using 'tokenCounter' instead
    const total = await contract.tokenCounter();
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
            <img src="${(metadata.image || '').replace("ipfs://", "https://ipfs.io/ipfs/")}" alt="${metadata.name || 'NFT'}" />
          `;
          circle.appendChild(art);
        }
      } catch (e) {
        console.error("Error loading tokenId", i, e);
      }
    }
  } catch (error) {
    console.error("Error in loadPremiumNFTs:", error);
  }
}

window.addEventListener("DOMContentLoaded", loadPremiumNFTs);
