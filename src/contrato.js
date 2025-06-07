import { ethers } from "ethers";
import contratoABI from "./api/NandartNFT_ABI.json" assert { type: "json" };

// Mapeamento de endereços do contrato por rede
const addressesPorRede = {
  80001: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41", // Mumbai Testnet
  137:   "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"           // <- Substitui aqui pelo endereço real
};

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

  console.log(`Rede ativa: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Contrato a usar: ${contratoAddress}`);

  return new ethers.Contract(contratoAddress, contratoABI, signer);
}
