import { ethers } from './ethers.min.js';
import NandartNFT_ABI from './abi/NandartNFT_ABI.json' assert { type: "json" };

const contractAddress = "0xeAA6711D4d6604Aeb134aa90bE7a7439aE473440";
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(contractAddress, NandartNFT_ABI, provider);

const premiumCircle = document.getElementById("premium-circle");

async function loadPremiumNFTs() {
    for (let tokenId = 0; tokenId < 50; tokenId++) {
        try {
            const tokenURI = await contract.tokenURI(tokenId);
            const response = await fetch(`https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`);
            const metadata = await response.json();

            if (metadata.premium === true) {
                const img = document.createElement("img");
                img.src = `https://ipfs.io/ipfs/${metadata.image.replace("ipfs://", "")}`;
                img.alt = metadata.title || "NFT";
                img.className = "floating-art";
                premiumCircle.appendChild(img);
            }
        } catch (err) {
            console.log("Token", tokenId, "não encontrado ou erro:", err.message);
        }
    }
}

window.addEventListener("DOMContentLoaded", loadPremiumNFTs);
