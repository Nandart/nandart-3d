import { ethers } from "ethers";

// Endereços do contrato por rede
const addressesPorRede = {
  80001: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41", // Mumbai Testnet
  137: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"   // Polygon Mainnet
};

// Carregamento do ABI via fetch para evitar erro de MIME Type
async function loadABI() {
  const response = await fetch("/src/abi/NandartNFT_ABI.json");
  if (!response.ok) {
    throw new Error("Erro ao carregar o ABI JSON");
  }
  return await response.json();
}

export async function getContrato() {
  if (!window.ethereum) {
    throw new Error("MetaMask não encontrado. Por favor, instala para continuar.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  const contratoAddress = addressesPorRede[network.chainId];
  if (!contratoAddress) {
    throw new Error(`Contrato não definido para a rede ${network.name} (chainId: ${network.chainId})`);
  }

  const contratoABI = await loadABI();

  console.log(`🟢 Rede ativa: ${network.name} (chainId: ${network.chainId})`);
  console.log(`🎨 Contrato a usar: ${contratoAddress}`);

  return new ethers.Contract(contratoAddress, contratoABI, signer);
}
