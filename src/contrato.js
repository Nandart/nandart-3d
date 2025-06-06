import { ethers } from "ethers";

// Endereço do contrato na rede (Mumbai ou Polygon)
const contratoAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";

// ABI expandida
const contratoABI = [
  "function mintComCuradoria(address artista, string tokenURI_) payable returns (uint256)",
  "function mintForArtist(address artista, uint256 price) returns (uint256)",
  "function buy(uint256 tokenId) payable",
  "function activatePremium(uint256 tokenId) payable",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function isPremiumActive(uint256 tokenId) view returns (bool)",
  "function isWhitelisted(address) view returns (bool)",
  "function adicionarCurador(address curador)",
  "function removerCurador(address curador)",
  "function setGalerieWallet(address newWallet)",
  "function artworks(uint256 tokenId) view returns (address artist, uint256 price, bool premiumActive)"
];

// Função para instanciar o contrato com signer
export async function getContrato() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contratoAddress, contratoABI, signer);
}
