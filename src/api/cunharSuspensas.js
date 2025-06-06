import { getContrato } from './contrato.js';

async function cunharObrasSuspensas() {
  const contrato = await getContrato();

  const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
  const curador = contas[0];

  for (const obra of artworkData) {
    try {
      const valor = ethers.parseEther(obra.price.toString());

      const tx = await contrato.mintComCuradoria(
        obra.artista,       // o artista recebe a NFT
        obra.tokenURI,
        { value: valor }
      );

      console.log(`Cunhagem da obra "${obra.title}" enviada. TX: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Cunhagem da obra "${obra.title}" concluída com sucesso.`);
    } catch (erro) {
      console.error(`❌ Erro ao cunhar "${obra.title}":`, erro);
    }
  }
}
