import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

const walletButton = document.getElementById('wallet-button');
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Fundo cinza escuro visível

const textureLoader = new THREE.TextureLoader();
const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 45;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, 9, 22);
  camera.lookAt(0, 7, -config.wallDistance);
  camera.near = 0.1;
  camera.far = 100;
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  alpha: true
});
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

const ambientLight1 = new THREE.AmbientLight(0xfff2dd, 1.2); // Duplicada a intensidade para paredes visíveis
const hemisphereLight = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.35);
scene.add(ambientLight1, hemisphereLight);

const spotLightLeft = new THREE.SpotLight(0xfff2dd, 0.6);
spotLightLeft.position.set(-10, 8, 0);
spotLightLeft.angle = Math.PI / 6;
spotLightLeft.penumbra = 0.3;
spotLightLeft.decay = 2;
spotLightLeft.distance = 25;
spotLightLeft.castShadow = true;
spotLightLeft.shadow.mapSize.width = 1024;
spotLightLeft.shadow.mapSize.height = 1024;
spotLightLeft.shadow.bias = -0.0005;
scene.add(spotLightLeft);
const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 0
});

floor.material.opacity = 0.15;
floor.material.roughness = 0.01;
floor.material.metalness = 0.99;
floor.material.transparent = true;
floor.material.envMapIntensity = 3.0;
floor.material.reflectivity = 0.99;
floor.material.ior = 1.45;
floor.material.thickness = 0.5;
floor.material.side = THREE.DoubleSide;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo de luz central restaurado
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.3, 4.55, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.8,
    metalness: 0.75,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.051;
circle.receiveShadow = true;
scene.add(circle);
const trimMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3cc80,
  metalness: 1,
  roughness: 0.08,
  emissive: 0xf3cc80,
  emissiveIntensity: 0.45
});

function createTrimLine(x, y, z, width, height = 0.06, rotY = 0) {
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.02),
    trimMaterial
  );
  trim.position.set(x, y, z);
  trim.rotation.y = rotY;
  trim.castShadow = false;
  trim.receiveShadow = false;
  scene.add(trim);
  return trim;
}

function createTrimRect(x, y, z, width, height, rotY = 0) {
  const group = new THREE.Group();
  const thickness = 0.06;

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  top.position.set(0, height / 2, 0);
  top.receiveShadow = false;
  group.add(top);

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  bottom.position.set(0, -height / 2, 0);
  bottom.receiveShadow = false;
  group.add(bottom);

  const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  left.position.set(-width / 2 + thickness / 2, 0, 0);
  left.receiveShadow = false;
  group.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  right.position.set(width / 2 - thickness / 2, 0, 0);
  right.receiveShadow = false;
  group.add(right);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// Frisos centrais e laterais
const centerTrim = createTrimRect(
  0,
  10.3,
  -config.wallDistance + 0.01,
  6.8,
  7.0
);
createTrimLine(0, 13.1, -config.wallDistance + 0.012, 4.5);

const sideTrimPosX = 6.7;
const outerTrimHeight = 8.8;
const innerTrimHeight = 7.1;

createTrimRect(-sideTrimPosX, 10.3, -config.wallDistance + 0.01, 3.2, outerTrimHeight);
createTrimRect(-sideTrimPosX, 10.3, -config.wallDistance + 0.012, 1.6, innerTrimHeight);
createTrimRect(sideTrimPosX, 10.3, -config.wallDistance + 0.01, 3.2, outerTrimHeight);
createTrimRect(sideTrimPosX, 10.3, -config.wallDistance + 0.012, 1.6, innerTrimHeight);
// Remover blocos extras e alinhar corretamente pedestais e obras laterais
const goldMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.9,
  clearcoatRoughness: 0.05,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

const gemTexture = textureLoader.load('/assets/gemas/gema-azul.png');
const showcaseTexture = textureLoader.load('/assets/vitrine-escura.jpg');

function createShowcase(x, z, index) {
  const pedestalHeight = 4.6;
  const showcaseHeight = 1.6;
  const gemHeight = pedestalHeight + showcaseHeight / 2 + 0.25;
  const emissiveColor = 0x3377cc;
  const emissiveIntensity = 2.4;

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, pedestalHeight, 1.05),
    new THREE.MeshStandardMaterial({
      map: showcaseTexture,
      roughness: 0.5,
      metalness: 0.25
    })
  );
  pedestal.position.set(x, pedestalHeight / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  const goldTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    goldMaterial
  );
  goldTop.position.set(x, pedestalHeight + 0.03, z);
  goldTop.castShadow = true;
  scene.add(goldTop);

  const showcase = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, showcaseHeight, 1.0),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.02,
      transmission: 1,
      thickness: 0.5,
      transparent: true,
      opacity: 0.1,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 0.9,
      clearcoatRoughness: 0.02
    })
  );
  showcase.position.set(x, pedestalHeight + showcaseHeight / 2 + 0.06, z);
  showcase.castShadow = true;
  scene.add(showcase);

  const gem = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshStandardMaterial({
      map: gemTexture,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      transparent: true,
      opacity: 0.95
    })
  );
  gem.position.set(x, gemHeight, z);
  gem.rotation.y = index * 0.3;
  gem.castShadow = true;
  scene.add(gem);
}

// Alinhar showcases laterais
createShowcase(-12.0 - 1.2, -1.8, 0); // Ajuste para alinhar com a obra lateral esquerda
createShowcase(-12.0 + 1.2, -1.8, 1);
createShowcase(12.0 - 1.2, 1.8, 2);
createShowcase(12.0 + 1.2, 1.8, 3);
// Textura das paredes realista e iluminação ajustada
const wallTexture = textureLoader.load('/assets/antracite-realista.jpg', texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
});

const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture,
  color: 0x2a2a2a,
  emissive: 0x111111,
  emissiveIntensity: 0.5,
  roughness: 0.7,
  metalness: 0.1,
  side: THREE.FrontSide
});

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), wallMaterial);
backWall.position.set(0, 13.6, -config.wallDistance - 4.1);
backWall.receiveShadow = true;
scene.add(backWall);

const sideWallGeo = new THREE.PlaneGeometry(30, 28);

const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
leftWall.position.set(-14.6, 13.4, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
rightWall.position.set(14.6, 13.4, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);
// Textura e sombras para as obras nas paredes laterais
const wallArtworks = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -12.0,
    y: 9.1,
    z: 0,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 12.0,
    y: 9.1,
    z: 0,
    rotY: -Math.PI / 2
  }
];

wallArtworks.forEach(({ src, x, y, z, rotY }) => {
  const texture = textureLoader.load(
    src,
    texture => {
      const width = 4.4;
      const height = 6.4;

      const artworkGroup = new THREE.Group();

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0x1e1a16,
          metalness: 0.6,
          roughness: 0.3,
          emissive: 0x0d0c0a,
          emissiveIntensity: 0.15
        })
      );
      frame.position.z = -0.1;
      artworkGroup.add(frame);

      const painting = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.05,
          side: THREE.FrontSide
        })
      );
      painting.position.z = 0.01;
      artworkGroup.add(painting);

      artworkGroup.position.set(x, y, z);
      artworkGroup.rotation.y = rotY;
      scene.add(artworkGroup);
    },
    undefined,
    err => console.error(`Error loading ${src}:`, err)
  );
});
// Resto do código (arte circulante, animação, modal e compra)

const artworkPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg",
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg",
  "/assets/obras/obra7.jpg",
  "/assets/obras/obra8.jpg"
];

const artworkData = [
  { title: "Fragmento da Eternidade", artist: "Inês Duarte", year: "2023", price: "0.8", description: "Dimensões temporais.", image: "/assets/obras/obra1.jpg" },
  { title: "Sombras de Luz", artist: "Miguel Costa", year: "2024", price: "0.5", description: "Contraste luz e sombra.", image: "/assets/obras/obra2.jpg" },
  { title: "Horizonte Partilhado", artist: "Clara Mendonça", year: "2022", price: "1.2", description: "Horizonte urbano.", image: "/assets/obras/obra3.jpg" },
  { title: "Memórias de Silêncio", artist: "Rui Valente", year: "2023", price: "0.6", description: "Memórias no silêncio.", image: "/assets/obras/obra4.jpg" },
  { title: "Ritmo Contido", artist: "Joana Serra", year: "2025", price: "0.75", description: "Movimento congelado.", image: "/assets/obras/obra5.jpg" },
  { title: "Flutuação Interior", artist: "André Luz", year: "2023", price: "1.0", description: "Cores fluidas.", image: "/assets/obras/obra6.jpg" },
  { title: "Verso Encoberto", artist: "Sofia Rocha", year: "2024", price: "0.4", description: "Texturas ocultas.", image: "/assets/obras/obra7.jpg" },
  { title: "Silhueta do Amanhã", artist: "Tiago Faria", year: "2025", price: "0.9", description: "Formas orgânicas.", image: "/assets/obras/obra8.jpg" }
];

const artworks = [];
let animationSpeed = -0.00012;
let originalAnimationSpeed = -0.00012;

artworkPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const angle = (i / artworkPaths.length) * Math.PI * 2;
  const x = Math.cos(angle) * config.circleRadius;
  const z = Math.sin(angle) * config.circleRadius;
  const rotationY = -angle + Math.PI;

  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  artwork.position.set(x, 4.2, z);
  artwork.rotation.y = rotationY;
  artwork.castShadow = true;
  scene.add(artwork);

  artwork.userData.originalPosition = new THREE.Vector3(x, 4.2, z);
  artwork.userData.originalRotation = new THREE.Euler(0, rotationY, 0);
  artwork.userData.originalScale = new THREE.Vector3(1, 1, 1);

  artworks.push(artwork);
});

// Funções highlight e modal permanecem (posicionamento correto, modal centrado 2cm abaixo)

let selectedArtwork = null;
let isHighlighted = false;
const modal = document.querySelector('.art-modal');
const modalTitle = document.getElementById('art-title');
const modalDescription = document.getElementById('art-description');
const modalArtist = document.getElementById('art-artist');
const modalYear = document.getElementById('art-year');
const modalPrice = document.getElementById('art-price');
const buyButton = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');

function highlightArtwork(artwork, data) {
  if (isHighlighted) return;
  isHighlighted = true;
  selectedArtwork = artwork;

  artwork.renderOrder = 999;
  artwork.material.depthTest = false;
  artwork.material.depthWrite = false;

  const targetY = 6.3; 
  const targetZ = -config.wallDistance / 2;

  gsap.to(artwork.scale, { x: 2, y: 2, z: 2, duration: 0.8, ease: 'power2.out' });
  gsap.to(artwork.position, {
    x: 0, y: targetY, z: targetZ, duration: 0.8, ease: 'power2.out',
    onComplete: () => { gsap.to(artwork.rotation, { y: 0, duration: 0.5, ease: 'power2.out', onComplete: showModal }); }
  });

  blurOverlay.classList.add('active');

  function showModal() {
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;
    modalArtist.textContent = data.artist;
    modalYear.textContent = data.year;
    modalPrice.textContent = `${data.price} ETH`;

    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(artwork.matrixWorld);
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    const cmToPixels = 37.8;
    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${y + (2 * cmToPixels)}px`;
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('active'); }, 10);
  }
}

// Resto do código de interação, compra, animação e função animate segue no final com a mesma estrutura.

function restoreArtwork() {
  if (!isHighlighted) return;
  isHighlighted = false;

  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);

  selectedArtwork.renderOrder = 0;
  selectedArtwork.material.depthTest = true;
  selectedArtwork.material.depthWrite = true;

  gsap.to(selectedArtwork.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power2.out' });
  gsap.to(selectedArtwork.position, { 
    x: selectedArtwork.userData.originalPosition.x,
    y: selectedArtwork.userData.originalPosition.y,
    z: selectedArtwork.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });
  gsap.to(selectedArtwork.rotation, { y: selectedArtwork.userData.originalRotation.y, duration: 0.8, ease: 'power2.out' });
  blurOverlay.classList.remove('active');
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (isHighlighted) {
    if (!modal.contains(e.target)) restoreArtwork();
    return;
  }
  const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(artworks);
  if (intersects.length > 0) {
    const artwork = intersects[0].object;
    const index = artworks.indexOf(artwork);
    const data = artworkData[index];
    highlightArtwork(artwork, data);
  }
});

window.addEventListener('click', (e) => {
  if (isHighlighted && !modal.contains(e.target)) {
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (!raycaster.intersectObject(selectedArtwork).length) restoreArtwork();
  }
});

// Web3: conexão da carteira e compra
async function toggleWalletConnection() {
  if (!window.ethereum) {
    alert('Please install MetaMask.');
    return;
  }
  try {
    if (walletButton.classList.contains('connected')) {
      walletButton.classList.remove('connected');
      walletButton.innerHTML = 'Connect Wallet';
      walletButton.style.padding = '10px 18px 10px 42px';
    } else {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      const shortBalance = parseFloat(ethers.formatEther(balance)).toFixed(3);
      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  } catch (err) {
    console.error('Wallet connection error:', err);
    alert('Error connecting wallet.');
  }
}

async function buyHandler(data) {
  if (!window.ethereum) {
    alert('Install MetaMask.');
    return;
  }
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const ethValue = ethers.parseEther(data.price);
    const tx = await signer.sendTransaction({ to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', value: ethValue });
    alert(`Transaction sent! Hash: ${tx.hash}`);
    await tx.wait();
    alert('Purchase confirmed!');
  } catch (err) {
    console.error('Purchase error:', err);
    alert('Purchase error.');
  }
}

if (buyButton) buyButton.addEventListener('click', () => {
  if (selectedArtwork) {
    const index = artworks.indexOf(selectedArtwork);
    buyHandler(artworkData[index]);
  }
});

if (walletButton) walletButton.addEventListener('click', toggleWalletConnection);

window.addEventListener('load', async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length) {
      const balance = await provider.getBalance(accounts[0].address);
      const shortBalance = parseFloat(ethers.formatEther(balance)).toFixed(3);
      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  }
});

// Função animate no final absoluto
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * (isHighlighted ? animationSpeed / 2 : animationSpeed);
  artworks.forEach((artwork, i) => {
    if (artwork === selectedArtwork) return;
    const angle = time + (i / artworks.length) * Math.PI * 2;
    const x = Math.cos(angle) * config.circleRadius;
    const z = Math.sin(angle) * config.circleRadius;
    const rotationY = -angle + Math.PI;
    artwork.position.x = x;
    artwork.position.z = z;
    artwork.rotation.y = rotationY;
  });
  renderer.render(scene, camera);
}
animate();
