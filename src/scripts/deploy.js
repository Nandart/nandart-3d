async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract com a conta:", deployer.address);

  const NANdARTGallery = await ethers.getContractFactory("NANdARTGallery");
  const galerieWallet = deployer.address; // Ou outro endereço para receber fundos
  const contract = await NANdARTGallery.deploy(galerieWallet);

  await contract.deployed();

  console.log("Contrato deployado em:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
