import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';
import { obrasSuspensas } from './data/obras-suspensas.js';

// ==================== INITIAL CHECKS ====================
console.log("Initializing 3D Gallery...");

// Verify WebGL support
if (!WEBGL.isWebGLAvailable()) {
  const warning = WEBGL.getWebGLErrorMessage();
  document.getElementById('scene').appendChild(warning);
  throw new Error('WebGL not supported');
}

// Verify dependencies
if (!THREE || !gsap || !ethers) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #111; color: #ff6b6b; display: flex;
    justify-content: center; align-items: center; z-index: 10000;
    font-family: Arial, sans-serif; text-align: center; padding: 20px;
  `;
  errorMsg.innerHTML = `
    <div>
      <h2>Missing Required Libraries</h2>
      <p>Essential libraries failed to load. Please refresh the page.</p>
      <p>If the problem persists, check your network connection.</p>
    </div>
  `;
  document.body.appendChild(errorMsg);
  throw new Error('Essential libraries not loaded');
}

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ==================== RESOURCE TRACKING ====================
let loadedResources = 0;
const totalResources = 10 + obrasSuspensas.length; // Estimate based on typical resources

function updateLoadingProgress() {
  loadedResources++;
  document.getElementById('loaded-resources').textContent = loadedResources;
  document.getElementById('total-resources').textContent = totalResources;
  
  if (loadedResources >= totalResources) {
    setTimeout(() => {
      document.querySelector('.loading-screen').style.opacity = '0';
      setTimeout(() => {
        document.querySelector('.loading-screen').style.display = 'none';
      }, 500);
    }, 500);
  }
}

// ==================== CONFIGURATIONS ====================
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

// ==================== SCENE AND RENDERER ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Enhanced texture loader with error handling
const loadingManager = new THREE.LoadingManager(
  () => {
    console.log('All resources loaded');
    updateLoadingProgress();
  },
  (item, loaded, total) => {
    console.log(`Loading ${loaded}/${total}: ${item}`);
    updateLoadingProgress();
  },
  (error) => {
    console.error('Error loading resource:', error);
    document.getElementById('loading-error').style.display = 'block';
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);

// Renderer with enhanced configuration
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: "high-performance",
  failIfMajorPerformanceCaveat: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ==================== LIGHTING ====================
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight1.position.set(-5, 3, 5);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight2.position.set(5, 3, -5);
scene.add(fillLight2);

const spotLight = new THREE.SpotLight(0xffffff, 1.5, 20, Math.PI/6, 0.5, 1);
spotLight.position.set(0, 15, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// ==================== REFLECTIVE FLOOR ====================
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

// ==================== CAMERA ====================
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 6.5, config.cameraZ + 15.2);
  camera.lookAt(0, 7.3, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

// Enhanced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
    floorMirror.getRenderTarget().setSize(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    );
  }, 200);
});

// ==================== WALLS ====================
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

// Enhanced texture loading with fallbacks
textureLoader.load(
  '/assets/antracite-realista.jpg',
  (texture) => {
    aplicarTexturaParede(texture);
    updateLoadingProgress();
  },
  undefined,
  (error) => {
    console.error('Error loading primary wall texture:', error);
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      (fallbackTexture) => {
        aplicarTexturaParede(fallbackTexture);
        updateLoadingProgress();
      },
      undefined,
      (fallbackError) => {
        console.error('Error loading fallback wall texture:', fallbackError);
        aplicarTexturaParede(null);
        updateLoadingProgress();
      }
    );
  }
);

// ==================== CENTRAL ARTWORK ====================
const texturaCentral = textureLoader.load('/assets/obras/obra-central.jpg', updateLoadingProgress);
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

// ==================== DECORATIVE TRIMS ====================
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

// [Restante do código para criar frisos...]

// ==================== SUSPENDED CUBES ====================
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

  // Enhanced texture loading for cube artwork
  textureLoader.load(
    obra.imagem,
    (texture) => {
      const gema = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({
          map: texture,
          emissive: 0x3399cc,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.9
        })
      );
      cubo.add(gema);
      updateLoadingProgress();
    },
    undefined,
    (error) => {
      console.error(`Error loading artwork texture for ${obra.titulo}:`, error);
      // Create placeholder gem
      const gema = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({
          color: 0x3399cc,
          emissive: 0x3399cc,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.9
        })
      );
      cubo.add(gema);
      updateLoadingProgress();
    }
  );

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

// Load all suspended artworks
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

// ==================== INTERACTION ====================
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
const walletButton = document.getElementById('connect-wallet');
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

// Restore wallet connection on load
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

// ==================== CIRCULAR ARTWORKS ====================
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
    textureLoader.load(
      dados.imagem,
      (texture) => {
        const obra = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          new THREE.MeshStandardMaterial({
            map: texture, roughness: 0.2, metalness: 0.1,
            side: THREE.DoubleSide, transparent: true
          })
        );

        const angulo = (i / dadosObras.length) * Math.PI * 2;
        obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obra.lookAt(0, 4.2, 0);
        obra.userData = { index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.error(`Error loading circular artwork ${dados.titulo}:`, error);
        // Create placeholder artwork
        const obra = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.2,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true
          })
        );
        
        const angulo = (i / dadosObras.length) * Math.PI * 2;
        obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obra.lookAt(0, 4.2, 0);
        obra.userData = { index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      }
    );
  });
}

criarObrasNormais();

// ==================== ANIMATION ====================
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

// ==================== PURCHASE ====================
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

// Initial loading progress update
updateLoadingProgress();
