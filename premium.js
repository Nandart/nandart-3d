import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Substituir depois
const ABI = [
  "function purchasePremium() payable",
  "function galleryWallet() view returns (address)"
];

const PREMIUM_PRICE_ETH = "0.015"; // valor fixo por agora

async function payPremium() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask to proceed.");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.purchasePremium({
      value: ethers.utils.parseEther(PREMIUM_PRICE_ETH)
    });

    alert("Transaction submitted. Please wait for confirmation...");
    await tx.wait();

    alert("Premium service activated successfully!");
  } catch (error) {
    console.error("Payment error:", error);
    alert("Payment failed: " + (error?.message || "Unknown error."));
  }
}

// Exemplo de ligação ao botão
document.getElementById("pay-premium-btn").addEventListener("click", payPremium);
