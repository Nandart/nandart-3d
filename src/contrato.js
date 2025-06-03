import { ethers } from "ethers";

const contratoAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";

const contratoABI = [
  "function mintComCuradoria(address artista, string tokenURI_) payable returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)"
];

export async function getContrato() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contratoAddress, contratoABI, signer);
}

