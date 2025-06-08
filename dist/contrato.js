import { ethers } from "ethers";

// Endereços por rede
const addressesPorRede = {
  80001: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41", // Mumbai
  137:   "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"  // Polygon Mainnet
};

// Carrega ABI do caminho relativo com fetch
async function loadABI() {
  const response = await fetch("/abi/NandartNFT_ABI.json");  // <- Corrigido
  if (!response.ok) {
    throw new Error("Erro ao carregar ABI JSON");
  }
  return await response.json();
}

export async function getContrato() {
  if (!window.ethereum) {
    throw new Error("MetaMask não encontrado.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  const contratoAddress = addressesPorRede[network.chainId];
  if (!contratoAddress) {
    throw new Error(`Endereço não definido para chainId: ${network.chainId}`);
  }

  const abi = await loadABI();

  console.log(`🔗 Rede: ${network.name} | Contrato: ${contratoAddress}`);
  return new ethers.Contract(contratoAddress, abi, signer);
}
