import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';
import { obrasSuspensas } from './data/obras-suspensas.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 📱 Sistema de responsividade refinado (XS, SM, MD, LG)
function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

// Declaração da velocidade do movimento circular
const velocidadeObras = 0.3;

let config = configMap[getViewportLevel()];

// 🎨 Cena e carregador de texturas
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const textureLoader = new THREE.TextureLoader();

// 🎥 Câmara adaptativa
const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 6.5, config.cameraZ + 15.2);
  camera.lookAt(0, 7.3, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

// 🖥️ Renderizador com qualidade cinematográfica
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === INÍCIO Bloco 9 - Botão Connect Wallet e painel saldo ===
const walletButton = document.createElement('button');
walletButton.id = 'wallet-button';
walletButton.textContent = 'Connect Wallet';
document.body.appendChild(walletButton);

const walletBalance = document.createElement('div');
walletBalance.id = 'wallet-balance';
walletBalance.style.position = 'fixed';
walletBalance.style.top = '60px';
walletBalance.style.right = '20px';
walletBalance.style.color = '#c4b582';
walletBalance.style.fontFamily = "'Playfair Display', serif";
walletBalance.style.fontSize = '0.9em';
walletBalance.style.zIndex = '250';
walletBalance.style.opacity = '0';
walletBalance.style.transition = 'opacity 0.4s ease';
walletBalance.textContent = '';
document.body.appendChild(walletBalance);
// === FIM Bloco 9 ===

// === INÍCIO Bloco 10 - Variáveis e funções utilitárias Web3 ===
let walletAddress = null; // Endereço da carteira ligada

function abreviarEndereco(endereco) {
  if (!endereco) return '';
  return endereco.slice(0, 6) + '...' + endereco.slice(-4);
}

async function atualizarUIConexao() {
  if (!walletAddress) {
    walletButton.textContent = 'Connect Wallet';
    walletButton.classList.remove('connected');
    walletBalance.style.opacity = '0';
    walletBalance.textContent = '';
    return;
  }

  walletButton.textContent = `Disconnect (${abreviarEndereco(walletAddress)})`;
  walletButton.classList.add('connected');

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balanceBigInt = await provider.getBalance(walletAddress);
    const balanceETH = ethers.formatEther(balanceBigInt);
    walletBalance.textContent = `Balance: ${parseFloat(balanceETH).toFixed(4)} ETH`;
    walletBalance.style.opacity = '1';
  } catch {
    walletBalance.textContent = 'Balance: N/A';
    walletBalance.style.opacity = '1';
  }
}
// === FIM Bloco 10 ===

// === INÍCIO Bloco 11 - Funções ligar e desligar carteira ===
async function ligarCarteira() {
  if (!window.ethereum) {
    alert('Por favor instala a MetaMask para ligar a tua carteira.');
    return;
  }
  try {
    const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = contas[0];
    localStorage.setItem('walletAddress', walletAddress);
    await atualizarUIConexao();

    window.ethereum.on('accountsChanged', async (contasNovas) => {
      if (contasNovas.length === 0) {
        await desligarCarteira();
      } else {
        walletAddress = contasNovas[0];
        localStorage.setItem('walletAddress', walletAddress);
        await atualizarUIConexao();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

  } catch (err) {
    alert('Erro ao ligar a carteira. Tenta novamente.');
    console.error('Erro ligarCarteira:', err);
  }
}

async function desligarCarteira() {
  walletAddress = null;
  localStorage.removeItem('walletAddress');
  walletButton.textContent = 'Connect Wallet';
  walletButton.classList.remove('connected');
  walletBalance.style.opacity = '0';
  walletBalance.textContent = '';
}
// === FIM Bloco 11 ===

// === INÍCIO Bloco 12 - Event listener do botão e persistência ===
walletButton.addEventListener('click', async () => {
  if (!walletAddress) {
    await ligarCarteira();
  } else {
    await desligarCarteira();
  }
});

window.addEventListener('load', async () => {
  const enderecoGuardado = localStorage.getItem('walletAddress');
  if (enderecoGuardado && window.ethereum) {
    try {
      const contasAtuais = await window.ethereum.request({ method: 'eth_accounts' });
      if (contasAtuais.length > 0 && contasAtuais.includes(enderecoGuardado)) {
        walletAddress = enderecoGuardado;
        await atualizarUIConexao();
      } else {
        localStorage.removeItem('walletAddress');
      }
    } catch (err) {
      console.error('Erro ao restaurar ligação da carteira:', err);
      localStorage.removeItem('walletAddress');
    }
  }
});
// 🧱 Geometria base das paredes
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

// Função utilitária para aplicar a textura antracite às três paredes
const aplicarTexturaParede = textura => {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura,
    color: 0xffffff,
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.25,
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.FrontSide
  });

  // 🧱 Parede de fundo (central)
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // 🧱 Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-14.6, 13.4, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // 🧱 Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(14.6, 13.4, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
};

// 🌌 Carregamento da textura antracite com fallback remoto
textureLoader.load(
  '/assets/antracite-realista.jpg',
  texturaLocal => {
    console.log('✅ Textura antracite local carregada.');
    aplicarTexturaParede(texturaLocal);
  },
  undefined,
  () => {
    console.warn('⚠️ Falha ao carregar textura local. A usar versão remota...');
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      texturaRemota => aplicarTexturaParede(texturaRemota),
      undefined,
      err => console.error('❌ Erro ao carregar textura remota:', err)
    );
  }
);

// 🖼️ Textura da obra central (com fallback em caso de erro)
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroCentralGrupo = new THREE.Group();

// 📐 Dimensões reais da pintura sem moldura
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// 🟫 Moldura escura saliente com profundidade realista
const molduraCentral = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.18),
  new THREE.MeshStandardMaterial({
    color: 0x1e1a16,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x0d0c0a,
    emissiveIntensity: 0.15
  })
);
molduraCentral.position.z = -0.1;
quadroCentralGrupo.add(molduraCentral);

// 🖼️ Pintura central com leve metalização
const pinturaCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pinturaCentral.position.z = 0.01;
quadroCentralGrupo.add(pinturaCentral);

// 📌 Posicionamento final da obra central
quadroCentralGrupo.position.set(
  0,
  10.3,
  -config.wallDistance + 0.001
);
scene.add(quadroCentralGrupo);

// 🖼️ Dados das obras nas paredes laterais
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.48,
    y: 11.6,
    z: -config.wallDistance / 2 + 0.01,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.48,
    y: 11.6,
    z: -config.wallDistance / 2 + 0.01,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(
    src,
    undefined,
    undefined,
    err => console.error(`Erro ao carregar ${src}:`, err)
  );

  const largura = 4.4;
  const altura = 6.4;

  const grupoQuadro = new THREE.Group();

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.3, altura + 0.3, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x1e1a16,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x0d0c0a,
      emissiveIntensity: 0.15
    })
  );
  moldura.position.z = -0.1;
  grupoQuadro.add(moldura);

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );
  quadro.position.z = 0.01;
  grupoQuadro.add(quadro);

  grupoQuadro.position.set(x, y, z);
  grupoQuadro.rotation.y = rotY;
  scene.add(grupoQuadro);
});

// 🎨 Material dourado vivo fiel à imagem "dourado para friso.png"
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = false;
  scene.add(friso);
  return friso;
}

function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
  const group = new THREE.Group();
  const espessura = 0.06;

    const topo = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  topo.position.set(0, altura / 2, 0);
  group.add(topo);

  const base = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  base.position.set(0, -altura / 2, 0);
  group.add(base);

  const esquerda = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
  esquerda.position.set(-largura / 2 + espessura / 2, 0, 0);
  group.add(esquerda);

  const direita = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
  direita.position.set(largura / 2 - espessura / 2, 0, 0);
  group.add(direita);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// 🟡 Friso central redesenhado com respiro visual
criarFrisoRect(
  0,               // X
  10.3,            // Y (centro vertical do friso)
  -config.wallDistance + 0.01, // Z (junto à parede central)
  6.8,             // Largura
  7.0              // Altura
);

// Friso interior horizontal acima do quadro central
criarFrisoLinha(
  0,
  13.1,
  -config.wallDistance + 0.012,
  4.5
);

// 🟡 Frisos duplos verticais laterais com estrutura dupla
const posXFrisoLateral = 6.7;
const alturaFrisoExt = 8.8;
const alturaFrisoInt = 7.1;

// Lado esquerdo
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// Lado direito
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// 🟡 Frisos horizontais inferiores contínuos nas 3 paredes
criarFrisoLinha(0, 1.3, -config.wallDistance + 0.01, 36);     // fundo superior
criarFrisoLinha(0, 1.0, -config.wallDistance + 0.012, 36);    // fundo inferior
criarFrisoLinha(-16.2, 1.3, -config.wallDistance / 2, 2.2);   // lateral esq. sup.
criarFrisoLinha(-16.2, 1.0, -config.wallDistance / 2, 2.2);   // lateral esq. inf.
criarFrisoLinha(16.2, 1.3, -config.wallDistance / 2, 2.2);    // lateral dir. sup.
criarFrisoLinha(16.2, 1.0, -config.wallDistance / 2, 2.2);    // lateral dir. inf.
// main.js — Bloco 3

// Lista global para armazenar os cubos suspensos com as obras
const cubosSuspensos = [];

// Função para criar o cubo suspenso com a obra dentro (gema + textura)
function criarCuboSuspenso(obra, indice) {
  const tamanhoCubo = 1.5;

  // Cubo externo translúcido e etéreo
  const materialCubo = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    transparent: true,
    opacity: 0.18,
    roughness: 0.25,
    metalness: 0.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    reflectivity: 0.3
  });

  const geometriaCubo = new THREE.BoxGeometry(tamanhoCubo, tamanhoCubo, tamanhoCubo);
  const cubo = new THREE.Mesh(geometriaCubo, materialCubo);
  cubo.castShadow = true;
  cubo.receiveShadow = true;

  // Posicionamento fixo dos cubos suspensos — 4 posições base
  const posicoesCubos = [
    { x: -5, y: 5, z: 0 },
    { x: 5, y: 5, z: 0 },
    { x: -5, y: 5, z: -5 },
    { x: 5, y: 5, z: -5 }
  ];
  const pos = posicoesCubos[indice % posicoesCubos.length];
  cubo.position.set(pos.x, pos.y, pos.z);

  // Criar gema/textura da obra dentro do cubo
  const texturaObra = textureLoader.load(obra.imagem);

  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 1),
    new THREE.MeshStandardMaterial({
      map: texturaObra,
      emissive: 0x3399cc,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9
    })
  );
  gema.position.set(0, 0, 0);
  cubo.add(gema);

  // Guardar dados da obra no userData para referência futura
  cubo.userData = { obra };

  // Adicionar cubo à cena e ao array global
  scene.add(cubo);
  cubosSuspensos.push(cubo);

  // Interação - clicar no cubo
  cubo.cursor = 'pointer'; // Indica interatividade

  // Usar Raycaster para detectar clique - este código será integrado na função de clique global (ver bloco 4)
  cubo.onClick = () => {
    if (!walletAddress) {
      alert('A pré-venda desta obra está disponível. Liga a tua carteira para adquirir.');
    } else {
      abrirModal(obra, cubo);
    }
  };

  return cubo;
}

// Criar cubos suspensos para todas as obras importadas
obrasSuspensas.forEach((obra, idx) => {
  criarCuboSuspenso(obra, idx);
});
// main.js — Bloco 4

// Variável para controlar a obra que está aberta no modal
let obraSelecionada = null;
let cameraIsAnimating = false;

// Criar overlay desfocado para o fundo ao abrir modal
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  backdrop-filter: blur(6px);
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 50; display: none;
`;
document.body.appendChild(overlay);

// Painel informativo translúcido (modal)
const infoPanel = document.createElement('div');
infoPanel.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, 0);
  margin-top: calc(260px + 10px);
  padding: 20px;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  color: #fffbe6;
  font-family: Georgia, serif;
  text-align: center;
  z-index: 60;
  display: none;
  max-width: 320px;
`;
infoPanel.innerHTML = `
  <div id="art-title" style="font-size: 1.6em; font-weight: bold;"></div>
  <div id="art-artist" style="margin-top: 6px;"></div>
  <div id="art-year" style="margin-top: 2px;"></div>
  <div id="art-description" style="margin-top: 10px; font-style: italic;"></div>
  <div id="art-price" style="margin-top: 10px; font-weight: bold;"></div>
  <button id="buy-art" style="
    margin-top: 16px; padding: 10px 18px;
    background-color: #d8b26c; color: #111;
    border: none; border-radius: 6px;
    font-size: 1em; cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
  ">Buy</button>
`;
document.body.appendChild(infoPanel);

// Referências aos elementos do modal
const modalTitulo = infoPanel.querySelector('#art-title');
const modalArtista = infoPanel.querySelector('#art-artist');
const modalAno = infoPanel.querySelector('#art-year');
const modalDescricao = infoPanel.querySelector('#art-description');
const modalPreco = infoPanel.querySelector('#art-price');
const botaoComprar = infoPanel.querySelector('#buy-art');

// Função para abrir o modal com dados e animações
function abrirModal(dados, cubo) {
  if (obraSelecionada) return; // Evitar abrir múltiplos modais

  obraSelecionada = cubo;
  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalTitulo.textContent = dados.titulo;
  modalArtista.textContent = dados.artista;
  modalAno.textContent = dados.ano;
  modalDescricao.textContent = dados.descricao || 'Obra exclusiva da galeria NANdART';
  modalPreco.textContent = `${dados.preco} ETH`;

  // Animações para destacar a obra no espaço
  gsap.to(cubo.scale, { x: 2, y: 2, z: 2, duration: 0.8, ease: 'power2.out' });
  gsap.to(cubo.position, { x: 0, y: 10.5, z: 0, duration: 0.9, ease: 'power2.inOut' });
  gsap.to(camera.position, { x: 0, y: 10.5, z: 5.5, duration: 1.1, ease: 'power2.inOut' });

  cameraIsAnimating = true;
  setTimeout(() => { cameraIsAnimating = false; }, 1200);
}

// Fechar modal ao clicar fora do painel
window.addEventListener('pointerdown', e => {
  if (!obraSelecionada || cameraIsAnimating) return;
  if (!infoPanel.contains(e.target)) {
    gsap.to(obraSelecionada.scale, { x: 1, y: 1, z: 1, duration: 0.6 });
    gsap.to(obraSelecionada.position, {
      y: 5, duration: 0.6, // voltar à posição original (y = 5 dos cubos)
      onComplete: () => {
        overlay.style.display = 'none';
        infoPanel.style.display = 'none';
        obraSelecionada = null;
      }
    });

    gsap.to(camera.position, {
      x: 0,
      y: 11,
      z: 15,
      duration: 0.8
    });
  }
});

// Detectar clique nos cubos suspensos usando raycaster
renderer.domElement.addEventListener('pointerdown', e => {
  if (obraSelecionada || cameraIsAnimating) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Obter interseções com cubos suspensos
  const intersects = raycaster.intersectObjects(cubosSuspensos);

  if (intersects.length > 0) {
    const cuboClicado = intersects[0].object;
    if (cuboClicado.onClick) {
      cuboClicado.onClick();
    }
  }
});

// Evento clique no botão "Buy" no modal (deve estar implementado no Bloco 5)
botaoComprar.addEventListener('click', () => {
  if (!obraSelecionada) return;
  const obra = obraSelecionada.userData.obra;
  buyHandler(obra); // Função de compra que será implementada (Bloco 5)
});
// main.js — Bloco 5

async function buyHandler(obra) {
  if (!window.ethereum) {
    alert('Instala a MetaMask para poder adquirir esta obra.');
    return;
  }

  try {
    // Pedir permissões para ligar carteira
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Valor em ETH convertido para Wei
    const valorETH = ethers.parseEther(obra.preco);

    // Endereço da galeria para receção do pagamento
    const enderecoGaleria = '0xAbCdEf1234567890abcdef1234567890ABcDef12'; // Substituir pelo endereço correto

    // Criar e enviar transação
    const tx = await signer.sendTransaction({
      to: enderecoGaleria,
      value: valorETH
    });

    alert(`Transação enviada!\nHash: ${tx.hash}`);
    await tx.wait();

    alert('Compra confirmada! Muito obrigado por adquirir esta obra.');

    // Atualizar UI ou estado local após compra — opcional
    // Poderá adicionar lógica para remover obra do cubo, alterar estado, etc.

  } catch (err) {
    console.error('Erro ao comprar a obra:', err);
    alert('Ocorreu um erro durante a compra. Por favor tenta novamente.');
  }
}
// main.js — Bloco 6

// Referência ao botão "Buy" do modal (definido no Bloco 4)
const botaoComprar = document.querySelector('#buy-art');

botaoComprar.addEventListener('click', () => {
  if (!obraSelecionada) return;

  // Dados da obra selecionada (armazenados no cubo)
  const dados = obraSelecionada.userData?.obra || null;
  if (!dados) {
    alert('Erro: dados da obra não encontrados.');
    return;
  }

  // Disparar função de compra
  buyHandler(dados);
});
// main.js — Bloco 7

// Lista global para obras normais e seus dados
const obrasNormais = [];
const dadosObras = [
  {
    titulo: 'Obra 1',
    artista: 'Artista A',
    ano: '2024',
    descricao: 'Descrição da Obra 1.',
    preco: '0.5',
    imagem: '/assets/obras/obra1.jpg'
  },
  {
    titulo: 'Obra 2',
    artista: 'Artista B',
    ano: '2023',
    descricao: 'Descrição da Obra 2.',
    preco: '0.6',
    imagem: '/assets/obras/obra2.jpg'
  },
  {
    titulo: 'Obra 3',
    artista: 'Artista C',
    ano: '2025',
    descricao: 'Descrição da Obra 3.',
    preco: '0.45',
    imagem: '/assets/obras/obra3.jpg'
  },
  // Acrescenta mais obras conforme necessário
];

// Criar obras normais e posicioná-las em círculo
function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    const textura = textureLoader.load(dados.imagem);

    const obraMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
      new THREE.MeshStandardMaterial({
        map: textura,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true
      })
    );

    // Posição circular inicial
    const angulo = (i / dadosObras.length) * Math.PI * 2;
    obraMesh.position.set(
      Math.cos(angulo) * raio,
      4.2,
      Math.sin(angulo) * raio
    );
    obraMesh.lookAt(0, 4.2, 0);

    // Guardar índice para referência nos eventos
    obraMesh.userData = { index: i };

    scene.add(obraMesh);
    obrasNormais.push(obraMesh);
  });
}

criarObrasNormais();

let anguloAtual = 0;

// Animação das obras normais em círculo
function animarObrasCirculares(delta) {
  const velocidade = velocidadeObras;

  anguloAtual += velocidade * delta;

  const raio = config.circleRadius;
  const yPos = 4.2;

  obrasNormais.forEach((obra, i) => {
    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(
      Math.cos(angulo) * raio,
      yPos,
      Math.sin(angulo) * raio
    );
    obra.lookAt(0, yPos, 0);
  });
}

// Detectar clique nas obras normais (pode substituir ou juntar ao evento do cubo suspenso)
renderer.domElement.addEventListener('pointerdown', e => {
  if (obraSelecionada || cameraIsAnimating) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais);
  if (intersects.length > 0) {
    const obra = intersects[0].object;
    const index = obra.userData.index;
    const dados = dadosObras[index];
    abrirModal(dados, obra);
  }
});
// main.js — Bloco 8

// Relógio para calcular delta time
const relogio = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();

  // Animar obras normais em círculo
  animarObrasCirculares(delta);

  // Aqui podes adicionar outras animações ou atualizações futuras

  renderer.render(scene, camera);
}

animate();
