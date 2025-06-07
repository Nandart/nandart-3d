import { ethers } from "ethers";
import contratoABI from "./abi/NandartNFT_ABI.json"; // sem assert

const addressesPorRede = {
  80001: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41", // Mumbai
  137: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"   // Polygon (confirmado por ti)
};

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

  return new ethers.Contract(contratoAddress, contratoABI, signer);
}
