function getTokenId(data) {
  if (data && typeof data.tokenId !== 'undefined') {
    return data.tokenId;
  }

  // Tentativa de extrair a partir do tokenURI, se houver padrão com número no nome
  try {
    const fallback = data.tokenURI?.split('/').pop().split('.')[0].split('_').pop();
    const parsed = parseInt(fallback);
    return isNaN(parsed) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

import { getContrato } from "./contrato.js";
import { comprarObra, revenderObra, linkOpenSea } from "./market.js";
// Versão final com iluminação específica para paredes
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// --- VARIÁVEIS DE ESTADO DA INTERAÇÃO ---
let isHighlighted = false;
let selectedArtwork = null;
// Configuração de camadas para evitar desfoque
const LAYERS = {
  DEFAULT: 0,
  HIGHLIGHTED: 1,  // Camara para obras destacadas
  WALLS: 2         // Já existente para paredes
};
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
  {
    title: "Fragment of Eternity",
    artist: "Rénner Nunes",
    year: "2023",
    price: "0.08",
    tokenURI: "https://ipfs.io/ipfs/bafkreibhrxsmbi6t36qupa5zw6mrc5n5voirsclvkkolobj7wudm5emot4/fragment_of_eternity.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Shadows of Light",
    artist: "Rénner Nunes",
    year: "2024",
    price: "0.01",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/shadows_of_light.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Shared Horizon",
    artist: "Rénner Nunes",
    year: "2022",
    price: "1",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/shared_horizon.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Memories of Silence",
    artist: "Rénner Nunes",
    year: "2023",
    price: "0.15",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/memories_of_silence.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Contained Rhythm",
    artist: "Rénner Nunes",
    year: "2025",
    price: "0.0001",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/contained_rhythm.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Inner Fluctuation",
    artist: "Rénner Nunes",
    year: "2023",
    price: "0.2",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/inner_fluctuation.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Fragments of Identity",
    artist: "Rénner Nunes",
    year: "2023",
    price: "1.55",
    tokenURI: "ipfs://bafkreieevpfuos62jiiflarwwpgubw3znzsfv5fjl3k2tv2uiykpeiueee",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41",
    tokenId: 15
  },
  {
    title: "Silhouette of Tomorrow",
    artist: "Rénner Nunes",
    year: "2024",
    price: "0.04",
    tokenURI: "ipfs://bafkreif45vd7woswi3pbdzrowr6mtkobu6e7wop4yj3lukn4l4lm6k6h6y",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  }
];
const scene = new THREE.Scene();

// === CHÃO REFLEXIVO ===
import { Reflector } from 'three/addons/objects/Reflector.js';
const groundMirror = new Reflector(
  new THREE.PlaneGeometry(100, 100),
  {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x111111
  }
);
groundMirror.rotateX(-Math.PI / 2);
groundMirror.position.y = 0.001;
scene.add(groundMirror);

scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 50;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, 12, 25);
  camera.lookAt(0, 5, -config.wallDistance);
  camera.near = 0.1;
  camera.far = 150;
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
scene.background = new THREE.Color('#000811');

// === NÉVOA ATMOSFÉRICA ===
scene.fog = new THREE.FogExp2(0x111111, 0.015);

renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iluminação
const hemisphereLight = new THREE.HemisphereLight(
  0xfff2e0,
  0x202020,
  1.35
);
hemisphereLight.groundColor.setHSL(0.1, 0.2, 0.15);
scene.add(hemisphereLight);

const fillLight = new THREE.AmbientLight(
  0xfff2dd, 
  0.225
);
scene.add(fillLight);

const spotLightLeft = new THREE.SpotLight(0xfff2dd, 1.5);
spotLightLeft.position.set(-10, 8, 0);
spotLightLeft.angle = Math.PI / 6;
spotLightLeft.penumbra = 0.3;
spotLightLeft.decay = 2;
spotLightLeft.distance = 25;
spotLightLeft.castShadow = true;
spotLightLeft.shadow.mapSize.width = 2048;
spotLightLeft.shadow.mapSize.height = 2048;
spotLightLeft.shadow.bias = -0.0005;
scene.add(spotLightLeft);

const spotLightRight = new THREE.SpotLight(0xfff2dd, 1.5);
spotLightRight.position.set(10, 8, 0);
spotLightRight.angle = Math.PI / 6;
spotLightRight.penumbra = 0.3;
spotLightRight.decay = 2;
spotLightRight.distance = 25;
spotLightRight.castShadow = true;
spotLightRight.shadow.mapSize.width = 2048;
spotLightRight.shadow.mapSize.height = 2048;
spotLightRight.shadow.bias = -0.0005;
scene.add(spotLightRight);

const createWallLight = (x, z, intensity) => {
    const light = new THREE.SpotLight(0xffffff, intensity, 25, Math.PI/4, 0.5);
    light.position.set(x, 15, z);
    light.target.position.set(x, 0, z > -10 ? -config.wallDistance/2 : -config.wallDistance);
    light.castShadow = false;
    return light;
};


const trimMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf3cc80,
  metalness: 1,
  reflectivity: 1,
  roughness: 0.04,
  roughness: 0.08,
  emissive: 0xf3cc80,
  emissiveIntensity: 0.25
});

const sideTrimPosX = 6.7;
const outerTrimHeight = 8.8;
const innerTrimHeight = 7.1;

const frameWidth = 4.6;
const frameHeight = 5.8;

const centerArtGroup = new THREE.Group();
const centerTexture = textureLoader.load(artworkPaths[0]);

const centerFrame = new THREE.Mesh(
  new THREE.BoxGeometry(frameWidth + 0.3, frameHeight + 0.3, 0.18),
  new THREE.MeshPhysicalMaterial({
    color: 0x1e1a16,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x0d0c0a,
    emissiveIntensity: 0.15
  })
);
centerFrame.position.z = -0.1;
centerArtGroup.add(centerFrame);

const centerPainting = new THREE.Mesh(
  new THREE.PlaneGeometry(frameWidth, frameHeight),
  new THREE.MeshPhysicalMaterial({
    map: centerTexture,
    roughness: 0.15,
    metalness: 0.1
  })
);
centerPainting.position.z = 0.01;
centerArtGroup.add(centerPainting);

centerArtGroup.position.set(
  0,
  10.3,
  -config.wallDistance + 0.001
);
scene.add(centerArtGroup);

// Configuração melhorada das paredes
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 28),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
backWall.position.set(0, 14, -config.wallDistance);
backWall.rotation.y = Math.PI;
backWall.layers.set(LAYERS.WALLS);

const leftWall = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 28),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
leftWall.position.set(-15, 14, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.layers.set(LAYERS.WALLS);

const rightWall = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 28),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
rightWall.position.set(15, 14, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.layers.set(LAYERS.WALLS);

scene.add(backWall);
scene.add(leftWall);
scene.add(rightWall);

const backWallLight1 = createWallLight(-5, -config.wallDistance, 2.2);
const backWallLight2 = createWallLight(5, -config.wallDistance, 2.2);
const leftWallLight1 = createWallLight(-15, -5, 1.8);
const leftWallLight2 = createWallLight(-15, 5, 1.8);
const rightWallLight1 = createWallLight(15, -5, 1.8);
const rightWallLight2 = createWallLight(15, 5, 1.8);

scene.add(backWallLight1);
scene.add(backWallLight2);
scene.add(leftWallLight1);
scene.add(leftWallLight2);
scene.add(rightWallLight1);
scene.add(rightWallLight2);

[backWallLight1, backWallLight2].forEach(light => {
  light.intensity = 2.2;
  light.color.setHex(0xf8e0c0);
  light.color.setHex(0xfff2e0);
});

[leftWallLight1, leftWallLight2, rightWallLight1, rightWallLight2].forEach(light => {
  light.intensity = 1.8;
  light.color.setHex(0xf8e0c0);
  light.color.setHex(0xfff2e0);
});

const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: config.textSize + 0.1,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const width = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const text = new THREE.Mesh(
      textGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xd8b26c,
        metalness: 1,
        reflectivity: 1,
        roughness: 0.04,
        roughness: 0.25,
        emissive: 0x8b6e3b,
        emissiveIntensity: 0.25
      })
    );

    text.position.set(-width / 2, 15.5, -config.wallDistance - 3.98);
    text.castShadow = true;
    
    const textLight = new THREE.SpotLight(0xfff1cc, 2.5, 12, Math.PI / 9, 0.4);
    textLight.position.set(0, 18, -config.wallDistance - 2);
    textLight.target = text;
    
    scene.add(text);
    scene.add(textLight);
    scene.add(textLight.target);
  }
);

scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color?.getHex() === 0xf3cc80
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.65,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.material?.color?.getHex() === 0x1e1a16
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.25,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.8,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});





export const obrasSuspensas = [
  {
    title: "Shadows of Light",
    artist: "Rénner Nunes",
    year: "2024",
    price: "0.01",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/shadows_of_light.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Shared Horizon",
    artist: "Rénner Nunes",
    year: "2022",
    price: "1",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/shared_horizon.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Memories of Silence",
    artist: "Rénner Nunes",
    year: "2023",
    price: "0.15",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/memories_of_silence.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Contained Rhythm",
    artist: "Rénner Nunes",
    year: "2025",
    price: "0.0001",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/contained_rhythm.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Inner Fluctuation",
    artist: "Rénner Nunes",
    year: "2023",
    price: "0.2",
    tokenURI: "https://ipfs.io/ipfs/bafybeia6bbrqltffiwc4hq6zfwciybwdjmwi3z7hn4w3wo7b3mbaxshfqy/inner_fluctuation.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Fragments of Identity",
    artist: "Rénner Nunes",
    year: "2023",
    price: "1.55",
    tokenURI: "ipfs://bafkreieevpfuos62jiiflarwwpgubw3znzsfv5fjl3k2tv2uiykpeiueee",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41",
    tokenId: 15
  },
  {
    title: "Silhouette of Tomorrow",
    artist: "Rénner Nunes",
    year: "2024",
    price: "0.04",
    tokenURI: "ipfs://bafkreif45vd7woswi3pbdzrowr6mtkobu6e7wop4yj3lukn4l4lm6k6h6y",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  }
];

const artworks = [];
const artworkReflections = [];
let originalAnimationSpeed = -0.00012;

artworkPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const angle = (i / artworkPaths.length) * Math.PI * 2;
  const x = Math.cos(angle) * config.circleRadius;
  const z = Math.sin(angle) * config.circleRadius;
  const rotationY = -angle + Math.PI;

  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  artwork.position.set(x, 4.2, z);
  artwork.rotation.y = rotationY;
  artwork.castShadow = true;
  artwork.receiveShadow = true;
  scene.add(artwork);

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    })
  );
  reflection.position.set(x, -4.2, z);
  reflection.rotation.x = Math.PI;
  reflection.rotation.y = rotationY;
  reflection.receiveShadow = false;
  reflection.castShadow = false;
  reflection.position.y += 0.05;
  reflection.scale.set(1, -1, 1);
  scene.add(reflection);
  artworkReflections.push(reflection);

  artwork.userData = {
    originalPosition: new THREE.Vector3(x, 4.2, z),
    originalRotation: new THREE.Euler(0, rotationY, 0),
    originalScale: new THREE.Vector3(1, 1, 1),
    reflection: reflection
  };

  artworks.push(artwork);
});

// ===== SISTEMA DE MODAL MINIMALISTA =====
const modal = document.querySelector('.art-modal');
const modalTitle = document.getElementById('art-title');
const modalDescription = document.getElementById('art-description');
const modalArtist = document.getElementById('art-artist');
const modalYear = document.getElementById('art-year');
const modalPrice = document.getElementById('art-price');
const buyButton = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');

modal.style.border = 'none';
modal.style.background = 'rgba(10, 10, 10, 0.88)';
modal.style.backdropFilter = 'blur(1.5px)';
modal.style.boxShadow = 'none';
modal.style.padding = '12px 16px';
modal.style.borderRadius = '4px';
modal.style.width = 'auto';
modal.style.maxWidth = 'none';

buyButton.style.padding = '6px 12px';
buyButton.style.fontSize = '0.82rem';
buyButton.style.marginTop = '10px';
buyButton.style.background = 'rgba(216, 178, 108, 0.9)';
buyButton.style.width = '50px';
buyButton.style.height = '30px';
buyButton.style.border = 'none';
buyButton.style.display = 'block';
buyButton.style.marginLeft = 'auto';
buyButton.style.marginRight = 'auto';

function calculateModalPosition(artwork) {
  const vector = new THREE.Vector3();
  vector.setFromMatrixPosition(artwork.matrixWorld);
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
  const width = artwork.geometry.parameters.width * 150 * (artwork.scale.x || 1);
  const height = artwork.geometry.parameters.height * 150 * (artwork.scale.y || 1);

  return {
    top: y - height/2,
    bottom: y + height/2,
    left: x - width/2,
    right: x + width/2,
    width: width,
    height: height
  };
}

function showArtModal(artworkPosition, data) {
  const dynamicElements = modal.querySelectorAll('.dynamic-element');
  dynamicElements.forEach(el => el.remove());

  const maxWidth = 280;
  
  modalTitle.textContent = data.title;
  modalDescription.textContent = data.description || '';
  modalArtist.textContent = data.artist;
  modalYear.textContent = data.year;
  modalPrice.textContent = `${data.price} ETH`;

  modal.style.maxWidth = `${Math.min(artworkPosition.width, maxWidth)}px`;
  modal.style.maxHeight = `${artworkPosition.height}px`;
  modal.style.overflow = 'auto';

  const openSeaButton = document.createElement('button');
  openSeaButton.className = 'dynamic-element';
  openSeaButton.textContent = "See on OpenSea";
  openSeaButton.style.marginLeft = "8px";
  
  openSeaButton.onclick = () => {
    console.log("🧪 Dados recebidos no modal:", data);
    if (data.tokenId !== undefined) {
      window.open(linkOpenSea(data.tokenId), '_blank');
    } else {
      alert("Este NFT ainda não foi cunhado.");
    }
  };

  const revendaDiv = document.createElement('div');
  revendaDiv.className = 'dynamic-element';
  revendaDiv.style.marginTop = '8px';
  revendaDiv.innerHTML = `
    <input type="text" placeholder="Buyer's address" id="revenda-address" style="width: 70%; padding: 4px;" />
    <button id="resell-button" style="padding: 4px 8px; margin-left: 6px;">resell</button>
  `;

  modal.appendChild(openSeaButton);
  modal.appendChild(revendaDiv);

  modal.style.display = 'flex';
  modal.style.top = `${artworkPosition.bottom - 5}px`;
  modal.style.left = `${artworkPosition.left + (artworkPosition.width / 2) - (maxWidth / 2)}px`;
  
  const modalRect = modal.getBoundingClientRect();
  if (modalRect.right > window.innerWidth) {
    modal.style.left = `${window.innerWidth - modalRect.width - 10}px`;
  }
  if (modalRect.left < 0) {
    modal.style.left = '10px';
  }
  
  modal.style.opacity = '0';
  modal.style.transform = 'translateY(8px)';
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.style.transform = 'translateY(0)';
    setTimeout(() => blurOverlay.style.opacity = '1', 10);
  }, 10);
}

async function highlightArtwork(artwork, data) {
  if (isHighlighted) return;
  isHighlighted = true;
  selectedArtwork = artwork;
  artwork.layers.set(LAYERS.DEFAULT);
  artwork.userData.reflection.visible = true;
  
  scene.remove(artwork);
  
  const highlightGroup = new THREE.Group();
  highlightGroup.position.copy(artwork.position);
  highlightGroup.rotation.copy(artwork.rotation);
  highlightGroup.scale.copy(artwork.scale);
  highlightGroup.add(artwork);
  scene.add(highlightGroup);
  
  artwork.userData.highlightGroup = highlightGroup;
  artwork.userData.reflection.visible = false;

  artwork.position.set(0, 0, 0);
  artwork.rotation.set(0, 0, 0);
  artwork.scale.set(1, 1, 1);

  await Promise.all([
    new Promise(resolve => gsap.to(highlightGroup.position, {
      x: 0,
      y: 8.4,
      z: -config.wallDistance / 2,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: resolve
    })),
    new Promise(resolve => gsap.to(highlightGroup.scale, {
      x: 3,
      y: 3,
      z: 3,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: resolve
    })),
    new Promise(resolve => gsap.to(highlightGroup.rotation, {
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: resolve
    }))
  ]);

  const artworkRect = calculateModalPosition(artwork);
  showArtModal(artworkRect, data);
}

async function restoreArtwork() {
  if (!isHighlighted || !selectedArtwork) return;

  const artwork = selectedArtwork;
  const highlightGroup = artwork.userData.highlightGroup;

  await Promise.all([
    new Promise(resolve => gsap.to(highlightGroup.position, {
      x: artwork.userData.originalPosition.x,
      y: artwork.userData.originalPosition.y,
      z: artwork.userData.originalPosition.z,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: resolve
    })),
    new Promise(resolve => gsap.to(highlightGroup.rotation, {
      y: artwork.userData.originalRotation.y,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: resolve
    })),
    new Promise(resolve => gsap.to(highlightGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: resolve
    }))
  ]);

  highlightGroup.remove(artwork);
  artwork.position.copy(artwork.userData.originalPosition);
  artwork.rotation.copy(artwork.userData.originalRotation);
  artwork.scale.copy(artwork.userData.originalScale);
  scene.add(artwork);
  scene.remove(highlightGroup);
  
  artwork.userData.reflection.visible = true;
  isHighlighted = false;
  selectedArtwork = null;
  
  modal.style.opacity = '0';
  modal.style.transform = 'translateY(8px)';
  blurOverlay.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
    blurOverlay.style.display = 'none';
  }, 250);
}

function handleArtInteraction(event) {
  event.preventDefault();
  
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(artworks, true);
  
  if (intersects.length > 0) {
    const clickedArtwork = intersects[0].object;
    const index = artworks.indexOf(clickedArtwork);
    
    if (index !== -1) {
      if (isHighlighted && selectedArtwork === clickedArtwork) {
        restoreArtwork();
      } 
      else if (!isHighlighted) {
        highlightArtwork(clickedArtwork, artworkData[index]);
      }
    }
  } 
  else if (isHighlighted) {
    restoreArtwork();
  }
}

function setupInteractionListeners() {
  renderer.domElement.addEventListener('pointerdown', handleArtInteraction);
  renderer.domElement.addEventListener('click', handleArtInteraction);
  
  document.addEventListener('click', (e) => {
    if (isHighlighted && !modal.contains(e.target) && e.target !== renderer.domElement) {
      restoreArtwork();
    }
  }, { passive: true });

  if (buyButton) {
    buyButton.addEventListener('click', () => {
      if (selectedArtwork) {
        const index = artworks.indexOf(selectedArtwork);
        buyHandler(artworkData[index]);
      }
    });
  }
}

setupInteractionListeners();

function animate() {
  requestAnimationFrame(animate);

  const speedFactor = isHighlighted ? 0.5 : 1;
  const time = Date.now() * originalAnimationSpeed * speedFactor;

  artworks.forEach((artwork, i) => {
    if (artwork === selectedArtwork) return;

    const angle = time + (i / artworks.length) * Math.PI * 2;
    const x = Math.cos(angle) * config.circleRadius;
    const z = Math.sin(angle) * config.circleRadius;
    const rotationY = -angle + Math.PI;

    artwork.position.x = x;
    artwork.position.z = z;
    artwork.rotation.y = rotationY;

    if (artwork.userData.reflection) {
      artwork.userData.reflection.position.x = x;
      artwork.userData.reflection.position.z = z;
      artwork.userData.reflection.rotation.y = rotationY;
    }
  });

  renderer.render(scene, camera);
}

async function toggleWalletConnection() {
  if (!window.ethereum) {
    alert('Please install MetaMask to connect your wallet.');
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
      const formattedBalance = ethers.formatEther(balance);
      const shortBalance = parseFloat(formattedBalance).toFixed(3);

      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  } catch (err) {
    console.error('Wallet connection error:', err);
    alert('Error connecting wallet. Please try again.');
  }
}

async function buyHandler(data) {
  const user = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
  await comprarObra(data, user);
  if (!window.ethereum) {
    alert('Install MetaMask to purchase this artwork.');
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const ethValue = ethers.parseEther(data.price);

    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
      value: ethValue
    });

    alert(`Transaction sent!\nHash: ${tx.hash}`);

    await tx.wait();
    alert('Purchase confirmed! Thank you for acquiring this artwork.');
  } catch (err) {
    console.error('Purchase error:', err);
    alert('Error during purchase. Please try again.');
  }
}

if (buyButton) {
  buyButton.addEventListener('click', () => {
    if (selectedArtwork) {
      const index = artworks.indexOf(selectedArtwork);
      const data = artworkData[index];
      buyHandler(data);
    }
  });
}

if (walletButton) {
  walletButton.addEventListener('click', toggleWalletConnection);
}

window.addEventListener('load', async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0].address);
      const formattedBalance = ethers.formatEther(balance);
      const shortBalance = parseFloat(formattedBalance).toFixed(3);

      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  }
});

animate();

async function mintArtwork(artwork, contrato, userAddress) {
  try {
    const valor = ethers.parseEther(artwork.price.toString());

    const tx = await contrato.mintComCuradoria(
      artwork.artista,
      artwork.tokenURI,
      { value: valor }
    );

    console.log(`NFT cunhado com sucesso: ${artwork.title}`);
    return tx;
  } catch (error) {
    console.error(`Erro ao cunhar "${artwork.title}":`, error);
  }
}

async function mintTodos(contrato, userAddress) {
  for (const obra of artworkData) {
    await mintArtwork(obra, contrato, userAddress);
  }
}

async function cunharObras() {
  const contrato = await getContrato();
  const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
  const user = contas[0];
  await mintTodos(contrato, user);
}

document.querySelectorAll('.artwork').forEach((obra) => {
  const sombra = document.createElement('div');
  sombra.classList.add('shadow-below-art');
  obra.appendChild(sombra);

  obra.addEventListener('click', (e) => {
    e.stopPropagation();
    removeHighlights();
    obra.classList.add('highlighted-artwork');
    const modal = document.querySelector(`#modal-${obra.dataset.id}`);
    if (modal) {
      modal.classList.add('dynamic-size');
      modal.style.display = 'block';
    }
  });
});

function removeHighlights() {
  document.querySelectorAll('.highlighted-artwork').forEach((o) =>
    o.classList.remove('highlighted-artwork')
  );
  document.querySelectorAll('.dynamic-size').forEach((m) => {
    m.classList.remove('dynamic-size');
    m.style.display = 'none';
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.artwork') && !e.target.closest('.art-modal')) {
    removeHighlights();
  }
});

document.querySelectorAll('.artwork').forEach((obra) => {
  let sombra = obra.querySelector('.shadow-below-art');
  if (!sombra) {
    sombra = document.createElement('div');
    sombra.classList.add('shadow-below-art');
    obra.appendChild(sombra);
  }
  sombra.style.position = 'absolute';
  sombra.style.bottom = '-8px';
  sombra.style.left = '50%';
  sombra.style.transform = 'translateX(-50%) scale(1)';
  sombra.style.width = '90px';
  sombra.style.height = '12px';
  sombra.style.background = 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)';
  sombra.style.zIndex = '1';
});

// === COLUNAS FUTURISTAS ===
const columnMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x89b4ff,
  metalness: 0.9,
  roughness: 0.05,
  clearcoat: 0.9,
  emissive: 0x406080,
  emissiveIntensity: 0.25
});

const createColumn = (x, z) => {
  const geometry = new THREE.CylinderGeometry(0.4, 0.4, 14, 32);
  const column = new THREE.Mesh(geometry, columnMaterial);
  column.position.set(x, 7, z);
  column.castShadow = true;
  column.receiveShadow = true;
  scene.add(column);
};

createColumn(-10, -config.wallDistance + 2);
createColumn(10, -config.wallDistance + 2);
createColumn(-12, 0);
createColumn(12, 0);
createColumn(-10, config.wallDistance - 2);
createColumn(10, config.wallDistance - 2);

// === LUZES VOLUMÉTRICAS ===
import { RectAreaLight, RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();

const rectLight1 = new THREE.RectAreaLight(0xfff2dd, 6, 8, 3);
rectLight1.position.set(0, 10, -config.wallDistance + 0.2);
rectLight1.lookAt(0, 6, 0);
scene.add(rectLight1);

const rectLight2 = new THREE.RectAreaLight(0xfff2dd, 4, 4, 2.5);
rectLight2.position.set(-10, 10, 0);
rectLight2.lookAt(0, 6, 0);
scene.add(rectLight2);

const rectLight3 = new THREE.RectAreaLight(0xfff2dd, 4, 4, 2.5);
rectLight3.position.set(10, 10, 0);
rectLight3.lookAt(0, 6, 0);
scene.add(rectLight3);

// === TEXTURA NAS PAREDES ===
const wallTexture = textureLoader.load('/assets/textures/wall_diffuse.jpg');
//const wallNormal = textureLoader.load('/assets/textures/texture_wall_from_layout_normal.jpg');
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture,
  normalMap: wallNormal,
  roughness: 0.8,
  metalness: 0.2,
  color: 0x1a1a1a
});

backWall.material = wallMaterial;
leftWall.material = wallMaterial;
rightWall.material = wallMaterial;

// === AJUSTES FINAIS DE ESTILO VISUAL ===
scene.background = new THREE.Color(0x0c0c12);
renderer.setClearColor(0x0c0c12, 1);
renderer.toneMappingExposure = 1.6;
