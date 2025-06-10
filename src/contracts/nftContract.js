import { ethers } from "ethers";

// Endereço do contrato deployado na blockchain (copiado do Remix)
const CONTRACT_ADDRESS = "0xeAA6711D4d6604Aeb134aa90bE7a7439aE473440"; // substitui pelo teu

// ABI do contrato (podes copiar da aba "ABI" no Remix)
import CONTRACT_ABI from "./NandartNFT_ABI.json";

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask não detectada");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return { signer, account: accounts[0], contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer) };
}

