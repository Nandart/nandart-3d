import { getContrato } from '../contrato.js';

async function carregarSubmissoes() {
  const lista = document.getElementById("curadoria-lista");
  lista.innerHTML = "";

  try {
    const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
    const user = contas[0];
    const contrato = await getContrato();
    const autorizado = await contrato.isWhitelisted(user);

    if (!autorizado) {
      lista.innerHTML = `<div class="alert-message">
        <p>Acesso restrito a curadores autorizados</p>
      </div>`;
      return;
    }

    const obras = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");

    if (obras.length === 0) {
      lista.innerHTML = `<div class="empty-message">
        <p>Nenhuma submissão pendente de aprovação</p>
      </div>`;
      return;
    }

    obras.forEach((obra, index) => {
      const div = document.createElement("div");
      div.className = "submission-card";
      div.innerHTML = `
        <div class="submission-image">
          <img src="${obra.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}" 
               alt="${obra.title}" 
               onerror="this.src='/assets/placeholder-artwork.png'">
        </div>
        <div class="submission-details">
          <h3>${obra.title}</h3>
          <p><strong>Artista:</strong> ${obra.artist}</p>
          <p><strong>Ano:</strong> ${obra.year}</p>
          <p><strong>Tipo:</strong> ${obra.preference}</p>
          <p><strong>Preço:</strong> ${obra.price} ETH</p>
          <div class="submission-actions">
            <button data-index="${index}" class="btn-approve">Aprovar</button>
            <button data-index="${index}" class="btn-reject">Rejeitar</button>
          </div>
        </div>
      `;
      lista.appendChild(div);
    });

    document.querySelectorAll(".btn-approve").forEach(btn => {
      btn.onclick = async () => {
        const index = btn.dataset.index;
        const obra = obras[index];
        btn.disabled = true;
        btn.textContent = "Processando...";
        
        try {
          const valor = ethers.parseEther(obra.price.toString());
          const tx = await contrato.mintComCuradoria(
            user,
            obra.tokenURI, 
            { value: valor }
          );
          await tx.wait();
          
          obras.splice(index, 1);
          localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
          carregarSubmissoes();
          showNotification("Obra aprovada e mintada com sucesso!");
        } catch (err) {
          console.error("Erro na aprovação:", err);
          btn.disabled = false;
          btn.textContent = "Aprovar";
          showNotification(`Erro: ${err.message}`, "error");
        }
      };
    });

    document.querySelectorAll(".btn-reject").forEach(btn => {
      btn.onclick = () => {
        const index = btn.dataset.index;
        obras.splice(index, 1);
        localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
        carregarSubmissoes();
        showNotification("Obra rejeitada");
      };
    });

  } catch (error) {
    console.error("Erro no painel de curadoria:", error);
    lista.innerHTML = `<div class="error-message">
      <p>Erro ao carregar submissões: ${error.message}</p>
    </div>`;
  }
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

if (document.getElementById("curadoria-lista")) {
  document.addEventListener("DOMContentLoaded", carregarSubmissoes);
}
