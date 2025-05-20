import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';
import { obrasSuspensas } from './data/obras-suspensas.js';

// Verificação inicial do ambiente
console.log("Inicializando galeria 3D...");
  document.body.appendChild(THREE.WEBGL.getWebGLErrorMessage());
  throw new Error('WebGL não suportado');

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ==================== CONFIGURAÇÕES ====================
const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

let config = configMap[getViewportLevel()];
const velocidadeObras = 0.3;

// ==================== CENA E RENDERIZADOR ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const textureLoader = new THREE.TextureLoader();

// Configuração avançada do renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ==================== ILUMINAÇÃO AVANÇADA ====================
// Luz ambiente suave
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

// Luz direcional principal
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Luzes de preenchimento
const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight1.position.set(-5, 3, 5);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight2.position.set(5, 3, -5);
scene.add(fillLight2);

// Luz de destaque para obras
const spotLight = new THREE.SpotLight(0xffffff, 1.5, 20, Math.PI/6, 0.5, 1);
spotLight.position.set(0, 15, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// ==================== CHÃO REFLETIVO ====================
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floorMirror = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x333333
});
floorMirror.rotation.x = -Math.PI / 2;
floorMirror.position.y = -0.1;
scene.add(floorMirror);

// ==================== CÂMERA ====================
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 6.5, config.cameraZ + 15.2);
  camera.lookAt(0, 7.3, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
  floorMirror.getRenderTarget().setSize(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
});

// ==================== PAREDES ====================
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

const aplicarTexturaParede = (textura) => {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura,
    color: 0xffffff,
    emissive: 0x111111,
    emissiveIntensity: 0.25,
    roughness: 0.65,
    metalness: 0.15
  });

  // Parede de fundo
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-14.6, 13.4, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(14.6, 13.4, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
};

textureLoader.load(
  '/assets/antracite-realista.jpg',
  aplicarTexturaParede,
  undefined,
  () => {
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      aplicarTexturaParede,
      undefined,
      () => aplicarTexturaParede(null)
    );
  }
);

// ==================== OBRAS CENTRAIS ====================
const texturaCentral = textureLoader.load('/assets/obras/obra-central.jpg');
const quadroCentralGrupo = new THREE.Group();
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

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

quadroCentralGrupo.position.set(0, 10.3, -config.wallDistance + 0.001);
scene.add(quadroCentralGrupo);

// ==================== FRISOS DECORATIVOS ====================
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
  scene.add(friso);
  return friso;
}

function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
  const group = new THREE.Group();
  const espessura = 0.06;

  [1, -1].forEach(side => {
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(largura, espessura, 0.02),
      frisoMaterial
    );
    horizontal.position.set(0, altura/2 * side, 0);
    group.add(horizontal);
  });

  [1, -1].forEach(side => {
    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(espessura, altura - espessura*2, 0.02),
      frisoMaterial
    );
    vertical.position.set(largura/2 * side - espessura/2 * side, 0, 0);
    group.add(vertical);
  });

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// Frisos centrais
criarFrisoRect(0, 10.3, -config.wallDistance + 0.01, 6.8, 7.0);
criarFrisoLinha(0, 13.1, -config.wallDistance + 0.012, 4.5);

// Frisos laterais
const posXFrisoLateral = 6.7;
const alturaFrisoExt = 8.8;
const alturaFrisoInt = 7.1;

[-1, 1].forEach(side => {
  criarFrisoRect(side * posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
  criarFrisoRect(side * posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);
});

// Frisos horizontais
[
  [0, 1.3, -config.wallDistance + 0.01, 36],
  [0, 1.0, -config.wallDistance + 0.012, 36],
  [-16.2, 1.3, -config.wallDistance / 2, 2.2],
  [-16.2, 1.0, -config.wallDistance / 2, 2.2],
  [16.2, 1.3, -config.wallDistance / 2, 2.2],
  [16.2, 1.0, -config.wallDistance / 2, 2.2]
].forEach(params => criarFrisoLinha(...params));

// ==================== CUBOS SUSPENSOS ====================
const cubosSuspensos = [];

function criarCuboSuspenso(obra, indice) {
  const tamanhoCubo = 1.5;
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

  const cubo = new THREE.Mesh(
    new THREE.BoxGeometry(tamanhoCubo, tamanhoCubo, tamanhoCubo),
    materialCubo
  );
  cubo.castShadow = cubo.receiveShadow = true;

  const posicoes = [
    { x: -5, y: 5, z: 0 },
    { x: 5, y: 5, z: 0 },
    { x: -5, y: 5, z: -5 },
    { x: 5, y: 5, z: -5 }
  ];
  const pos = posicoes[indice % posicoes.length];
  cubo.position.set(pos.x, pos.y, pos.z);

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
  cubo.add(gema);

  cubo.userData = { obra };
  cubosSuspensos.push(cubo);
  scene.add(cubo);

  cubo.onClick = () => {
    if (!walletAddress) {
      alert('A pré-venda desta obra está disponível. Liga a tua carteira para adquirir.');
    } else {
      abrirModal(obra, cubo);
    }
  };

  return cubo;
}

obrasSuspensas.forEach((obra, idx) => criarCuboSuspenso(obra, idx));

// ==================== MODAL ====================
let obraSelecionada = null;
let cameraIsAnimating = false;

const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  backdrop-filter: blur(6px); background-color: rgba(0, 0, 0, 0.4);
  z-index: 50; display: none;
`;
document.body.appendChild(overlay);

const infoPanel = document.createElement('div');
infoPanel.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, 0);
  margin-top: calc(260px + 10px); padding: 20px;
  background: rgba(255, 255, 255, 0.07); backdrop-filter: blur(4px);
  border-radius: 12px; color: #fffbe6; font-family: Georgia, serif;
  text-align: center; z-index: 60; display: none; max-width: 320px;
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

const modalElements = {
  titulo: infoPanel.querySelector('#art-title'),
  artista: infoPanel.querySelector('#art-artist'),
  ano: infoPanel.querySelector('#art-year'),
  descricao: infoPanel.querySelector('#art-description'),
  preco: infoPanel.querySelector('#art-price'),
  botao: infoPanel.querySelector('#buy-art')
};

function abrirModal(dados, cubo) {
  if (obraSelecionada) return;

  obraSelecionada = cubo;
  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalElements.titulo.textContent = dados.titulo;
  modalElements.artista.textContent = dados.artista;
  modalElements.ano.textContent = dados.ano;
  modalElements.descricao.textContent = dados.descricao || 'Obra exclusiva da galeria NANdART';
  modalElements.preco.textContent = `${dados.preco} ETH`;

  gsap.to(cubo.scale, { x: 2, y: 2, z: 2, duration: 0.8, ease: 'power2.out' });
  gsap.to(cubo.position, { x: 0, y: 10.5, z: 0, duration: 0.9, ease: 'power2.inOut' });
  gsap.to(camera.position, { 
    x: 0, y: 10.5, z: 5.5, duration: 1.1, ease: 'power2.inOut',
    onComplete: () => cameraIsAnimating = false
  });
  cameraIsAnimating = true;
}

function fecharModal() {
  gsap.to(obraSelecionada.scale, { x: 1, y: 1, z: 1, duration: 0.6 });
  gsap.to(obraSelecionada.position, {
    y: 5, duration: 0.6,
    onComplete: () => {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      obraSelecionada = null;
    }
  });
  gsap.to(camera.position, { x: 0, y: 11, z: 15, duration: 0.8 });
}

window.addEventListener('pointerdown', e => {
  if (!obraSelecionada || cameraIsAnimating || infoPanel.contains(e.target)) return;
  fecharModal();
});

// ==================== INTERAÇÃO ====================
renderer.domElement.addEventListener('pointerdown', e => {
  if (obraSelecionada || cameraIsAnimating) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([...cubosSuspensos]);
  if (intersects.length > 0 && intersects[0].object.onClick) {
    intersects[0].object.onClick();
  }
});

// ==================== WALLET ====================
const walletButton = document.createElement('button');
walletButton.id = 'wallet-button';
walletButton.textContent = 'Connect Wallet';
document.body.appendChild(walletButton);

const walletBalance = document.createElement('div');
walletBalance.id = 'wallet-balance';
walletBalance.style.cssText = `
  position: fixed; top: 60px; right: 20px; color: #c4b582;
  font-family: 'Playfair Display', serif; font-size: 0.9em;
  z-index: 250; opacity: 0; transition: opacity 0.4s ease;
`;
document.body.appendChild(walletBalance);

let walletAddress = null;

function abreviarEndereco(endereco) {
  return endereco ? `${endereco.slice(0, 6)}...${endereco.slice(-4)}` : '';
}

async function atualizarUIConexao(provider) {
  if (!walletAddress) {
    walletButton.textContent = 'Connect Wallet';
    walletButton.classList.remove('connected');
    walletBalance.style.opacity = '0';
    return;
  }

  walletButton.textContent = `Disconnect (${abreviarEndereco(walletAddress)})`;
  walletButton.classList.add('connected');

  try {
    const balance = await provider.getBalance(walletAddress);
    walletBalance.textContent = `Balance: ${parseFloat(ethers.formatEther(balance)).toFixed(4)} ETH`;
    walletBalance.style.opacity = '1';
  } catch {
    walletBalance.textContent = 'Balance: N/A';
    walletBalance.style.opacity = '1';
  }
}

async function ligarCarteira() {
  if (!window.ethereum) {
    alert('Por favor instala a MetaMask para ligar a tua carteira.');
    return;
  }

  try {
    const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = contas[0];
    localStorage.setItem('walletAddress', walletAddress);

    const provider = new ethers.BrowserProvider(window.ethereum);
    await atualizarUIConexao(provider);

    window.ethereum.on('accountsChanged', async (contasNovas) => {
      if (contasNovas.length === 0) {
        await desligarCarteira();
      } else {
        walletAddress = contasNovas[0];
        localStorage.setItem('walletAddress', walletAddress);
        await atualizarUIConexao(provider);
      }
    });

    window.ethereum.on('chainChanged', () => window.location.reload());

  } catch (err) {
    console.error('Erro ao ligar carteira:', err);
    alert('Erro ao ligar a carteira. Tenta novamente.');
  }
}

async function desligarCarteira() {
  walletAddress = null;
  localStorage.removeItem('walletAddress');
  await atualizarUIConexao(null);
}

walletButton.addEventListener('click', async () => {
  walletAddress ? await desligarCarteira() : await ligarCarteira();
});

window.addEventListener('load', async () => {
  const enderecoGuardado = localStorage.getItem('walletAddress');
  if (enderecoGuardado && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contas = await window.ethereum.request({ method: 'eth_accounts' });
      if (contas.includes(enderecoGuardado)) {
        walletAddress = enderecoGuardado;
        await atualizarUIConexao(provider);
      } else {
        localStorage.removeItem('walletAddress');
      }
    } catch (err) {
      console.error('Erro ao restaurar carteira:', err);
      localStorage.removeItem('walletAddress');
    }
  }
});

// ==================== OBRAS CIRCULARES ====================
const obrasNormais = [];
const dadosObras = [
  {
    titulo: 'Obra 1', artista: 'Artista A', ano: '2024',
    descricao: 'Descrição da Obra 1.', preco: '0.5', imagem: '/assets/obras/obra1.jpg'
  },
  {
    titulo: 'Obra 2', artista: 'Artista B', ano: '2023',
    descricao: 'Descrição da Obra 2.', preco: '0.6', imagem: '/assets/obras/obra2.jpg'
  },
  {
    titulo: 'Obra 3', artista: 'Artista C', ano: '2025',
    descricao: 'Descrição da Obra 3.', preco: '0.45', imagem: '/assets/obras/obra3.jpg'
  }
];

function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    const textura = textureLoader.load(dados.imagem);
    const obra = new THREE.Mesh(
      new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
      new THREE.MeshStandardMaterial({
        map: textura, roughness: 0.2, metalness: 0.1,
        side: THREE.DoubleSide, transparent: true
      })
    );

    const angulo = (i / dadosObras.length) * Math.PI * 2;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
    obra.userData = { index: i };

    scene.add(obra);
    obrasNormais.push(obra);
  });
}

criarObrasNormais();

// ==================== ANIMAÇÃO ====================
let anguloAtual = 0;
const relogio = new THREE.Clock();

function animarObrasCirculares(delta) {
  anguloAtual += velocidadeObras * delta;
  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}

function animate() {
  requestAnimationFrame(animate);
  animarObrasCirculares(relogio.getDelta());
  renderer.render(scene, camera);
}

animate();

// ==================== COMPRA ====================
modalElements.botao.addEventListener('click', async () => {
  if (!obraSelecionada?.userData?.obra) {
    alert('Erro: dados da obra não encontrados.');
    return;
  }

  if (!window.ethereum) {
    alert('Instala a MetaMask para poder adquirir esta obra.');
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
      value: ethers.parseEther(obraSelecionada.userData.obra.preco)
    });

    alert(`Transação enviada!\nHash: ${tx.hash}`);
    await tx.wait();
    alert('Compra confirmada! Obrigado.');
    fecharModal();

  } catch (err) {
    console.error('Erro na compra:', err);
    alert('Ocorreu um erro durante a compra. Por favor tenta novamente.');
  }
});
