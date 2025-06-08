import { ethers } from "ethers";

// Endereços do contrato por rede (usa sempre strings como keys)
const enderecosPorRede = {
  '137': '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // Polygon Mainnet
  // Adiciona aqui outras redes se necessário (ex: '80001': '0x...') para Mumbai
};

// Função para carregar o ABI via fetch
async function loadABI() {
  const response = await fetch("/abi/NandartNFT_ABI.json");
  if (!response.ok) {
    throw new Error("Erro ao carregar o ficheiro ABI JSON.");
  }
  return await response.json();
}

// Exporta o contrato instanciado, pronto a ser usado
export async function getContrato() {
  if (!window.ethereum) {
    throw new Error("MetaMask não foi detetado. Por favor instala a extensão.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  const chainId = network.chainId.toString();
  const contratoAddress = enderecosPorRede[chainId];

  if (!contratoAddress) {
    throw new Error(`⚠️ Rede não suportada (chainId ${chainId}). Liga-te à Polygon.`);
  }

  const abi = await loadABI();

  console.log(`🔗 Rede: ${network.name} (chainId ${chainId}) | Contrato: ${contratoAddress}`);

  return new ethers.Contract(contratoAddress, abi, signer);
}
