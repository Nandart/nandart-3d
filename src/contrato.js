import { ethers } from "ethers";

const addressesPorRede = {
  80001: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41",
  137: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
};

// ⚠️ Carregamento dinâmico do ABI a partir da pasta pública
async function loadABI() {
  const res = await fetch("/abi/NandartNFT_ABI.json");
  if (!res.ok) throw new Error("Erro ao carregar o ABI do contrato.");
  return await res.json();
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
    throw new Error(`Contrato não definido para a rede ${network.name} (chainId ${network.chainId})`);
  }

  const contratoABI = await loadABI();

  console.log(`Rede: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Contrato em uso: ${contratoAddress}`);

  return new ethers.Contract(contratoAddress, contratoABI, signer);
}
