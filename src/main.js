import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// ... [previous imports and initial setup remains the same until wall materials]

const applyWallTexture = texture => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x2a2a2a, // Dark gray for visibility
    emissive: 0x111111,
    emissiveIntensity: 0.5,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.FrontSide
  });
  wallMaterial.className = 'wall-material';

  const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
  backWall.position.set(0, 13.6, -config.wallDistance - 4.1);
  backWall.receiveShadow = true;
  scene.add(backWall);

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
};

// Update floor reflector to eliminate trim reflections
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 0
});

floor.material.opacity = 0.15;
floor.material.roughness = 0.3; // Increased roughness to reduce reflections
floor.material.metalness = 0.7; // Reduced metalness
floor.material.transparent = true;
floor.material.envMapIntensity = 1.5; // Reduced intensity
floor.material.reflectivity = 0.5; // Reduced reflectivity

// Update wall artworks positioning with pedestals
const wallArtworks = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -12.0,
    y: 9.1,
    z: 0, // Centered between pedestals (-1.8 and 1.8)
    rotY: Math.PI / 2,
    leftPedestal: -1.8,
    rightPedestal: 1.8
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 12.0,
    y: 9.1,
    z: 0, // Centered between pedestals
    rotY: -Math.PI / 2,
    leftPedestal: -1.8,
    rightPedestal: 1.8
  }
];

// Update highlight function
function highlightArtwork(artwork, data) {
  if (isHighlighted) return;
  isHighlighted = true;
  selectedArtwork = artwork;

  // Set half speed for other artworks
  animationSpeed = originalAnimationSpeed * 0.5;

  artwork.renderOrder = 999;
  artwork.material.depthTest = false;
  artwork.material.depthWrite = false;

  // Calculate target position at 1.5x height of circulating artworks
  const targetY = 4.2 * 1.5; // 1.5x height of circulating artworks
  const targetZ = -config.wallDistance / 2;

  gsap.to(artwork.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.position, {
    x: 0,
    y: targetY,
    z: targetZ,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(artwork.rotation, {
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: showModal
      });
    }
  });

  // Apply blur to everything except highlighted artwork
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

    // Position modal 2cm below artwork (converted from 3D space to pixels)
    const cmToPixels = 37.8; // Approximate conversion
    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${y + (2 * cmToPixels)}px`;

    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  }
}

function restoreArtwork() {
  if (!isHighlighted) return;
  isHighlighted = false;

  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);

  // Restore original animation speed
  animationSpeed = originalAnimationSpeed;

  selectedArtwork.renderOrder = 0;
  selectedArtwork.material.depthTest = true;
  selectedArtwork.material.depthWrite = true;

  gsap.to(selectedArtwork.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.position, {
    x: selectedArtwork.userData.originalPosition.x,
    y: selectedArtwork.userData.originalPosition.y,
    z: selectedArtwork.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.rotation, {
    y: selectedArtwork.userData.originalRotation.y,
    duration: 0.8,
    ease: 'power2.out'
  });

  blurOverlay.classList.remove('active');
}

// Update wall artwork creation with pedestals
wallArtworks.forEach(({ src, x, y, z, rotY, leftPedestal, rightPedestal }) => {
  const texture = textureLoader.load(
    src,
    texture => {
      const width = 4.4;
      const height = 6.4;

      const artworkGroup = new THREE.Group();

      // Create pedestals first
      createShowcase(x, leftPedestal, 0);
      createShowcase(x, rightPedestal, 1);

      // Then create artwork frame
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

createShowcase(-12.0, -1.8, 0);
createShowcase(-12.0, 1.8, 1);
createShowcase(12.0, -1.8, 2);
createShowcase(12.0, 1.8, 3);

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
      new THREE.MeshStandardMaterial({
        color: 0xc49b42,
        metalness: 1,
        roughness: 0.25,
        emissive: 0x2c1d07,
        emissiveIntensity: 0.45
      })
    );

    text.position.set(-width / 2, 15.5, -config.wallDistance - 3.98);
    text.castShadow = true;
    scene.add(text);

    const textLight = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
    textLight.position.set(0, 18, -config.wallDistance - 2);
    textLight.target = text;
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
    title: "Fragmento da Eternidade",
    artist: "Inês Duarte",
    year: "2023",
    price: "0.8",
    description: "Uma exploração das dimensões temporais através de texturas sobrepostas.",
    image: "/assets/obras/obra1.jpg"
  },
  {
    title: "Sombras de Luz",
    artist: "Miguel Costa",
    year: "2024",
    price: "0.5",
    description: "Contraste entre luz e sombra em movimento constante.",
    image: "/assets/obras/obra2.jpg"
  },
  {
    title: "Horizonte Partilhado",
    artist: "Clara Mendonça",
    year: "2022",
    price: "1.2",
    description: "Perspectivas múltiplas de um mesmo horizonte urbano.",
    image: "/assets/obras/obra3.jpg"
  },
  {
    title: "Memórias de Silêncio",
    artist: "Rui Valente",
    year: "2023",
    price: "0.6",
    description: "Abstração das memórias que permanecem no silêncio.",
    image: "/assets/obras/obra4.jpg"
  },
  {
    title: "Ritmo Contido",
    artist: "Joana Serra",
    year: "2025",
    price: "0.75",
    description: "Movimento congelado em padrões geométricos precisos.",
    image: "/assets/obras/obra5.jpg"
  },
  {
    title: "Flutuação Interior",
    artist: "André Luz",
    year: "2023",
    price: "1.0",
    description: "Estados emocionais representados através de cores fluidas.",
    image: "/assets/obras/obra6.jpg"
  },
  {
    title: "Verso Encoberto",
    artist: "Sofia Rocha",
    year: "2024",
    price: "0.4",
    description: "Texturas que revelam camadas ocultas da percepção.",
    image: "/assets/obras/obra7.jpg"
  },
  {
    title: "Silhueta do Amanhã",
    artist: "Tiago Faria",
    year: "2025",
    price: "0.9",
    description: "Visão futurista de formas orgânicas em evolução.",
    image: "/assets/obras/obra8.jpg"
  }
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

  gsap.to(artwork.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.position, {
    x: 0,
    y: targetY,
    z: targetZ,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(artwork.rotation, {
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: showModal
      });
    }
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

    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${y + 40}px`;

    modal.style.display = 'flex';
  }
}

function restoreArtwork() {
  if (!isHighlighted) return;
  isHighlighted = false;

  modal.style.display = 'none';

  selectedArtwork.renderOrder = 0;
  selectedArtwork.material.depthTest = true;
  selectedArtwork.material.depthWrite = true;

  gsap.to(selectedArtwork.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.position, {
    x: selectedArtwork.userData.originalPosition.x,
    y: selectedArtwork.userData.originalPosition.y,
    z: selectedArtwork.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.rotation, {
    y: selectedArtwork.userData.originalRotation.y,
    duration: 0.8,
    ease: 'power2.out'
  });

  blurOverlay.classList.remove('active');
}

function handleClickOutside(event) {
  if (isHighlighted && !modal.contains(event.target)) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(selectedArtwork);
    if (intersects.length === 0) {
      restoreArtwork();
    }
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (isHighlighted) {
    if (!modal.contains(e.target)) {
      restoreArtwork();
    }
    return;
  }

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

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

window.addEventListener('click', handleClickOutside);

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * (isHighlighted ? -0.00006 : -0.00012);

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
