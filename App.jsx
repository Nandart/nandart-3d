import { connectWallet } from "./nftContract";

async function mintNFT() {
  try {
    const { contract } = await connectWallet();

    const artista = "0x..."; // endereço Ethereum do artista (autorizado via whitelist)
    const uri = "ipfs://Qm..."; // IPFS da obra
    const valor = ethers.parseEther("1.0"); // 1 ETH como exemplo

    const tx = await contract.mintComCuradoria(artista, uri, { value: valor });
    await tx.wait();
    alert("NFT criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar NFT:", error);
    alert("Erro ao criar NFT. Ver consola.");
  }
}
