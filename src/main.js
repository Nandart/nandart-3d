import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// Selecionar o botão da carteira
const walletButton = document.getElementById('wallet-button');

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Sistema de responsividade mais eficaz
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

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

// Configuração avançada da câmera para capturar toda a cena
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
// Iluminação ambiente duplicada e chão ultra-reflexivo
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 1.2);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 1.2);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.35);
scene.add(luzHemisferica);

const luzRasanteEsquerda = new THREE.SpotLight(0xfff2dd, 0.6);
luzRasanteEsquerda.position.set(-10, 8, 0);
luzRasanteEsquerda.angle = Math.PI / 6;
luzRasanteEsquerda.penumbra = 0.3;
luzRasanteEsquerda.decay = 2;
luzRasanteEsquerda.distance = 25;
luzRasanteEsquerda.castShadow = true;
luzRasanteEsquerda.shadow.mapSize.width = 1024;
luzRasanteEsquerda.shadow.mapSize.height = 1024;
luzRasanteEsquerda.shadow.bias = -0.0005;
scene.add(luzRasanteEsquerda);

const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 2
});
floor.material.opacity = 0.12;
floor.material.roughness = 0.01;
floor.material.metalness = 1;
floor.material.transparent = true;
floor.material.envMapIntensity = 4.2;
floor.material.reflectivity = 1;
floor.material.ior = 1.6;
floor.material.thickness = 0.6;
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
// Paredes escuras com textura realista
textureLoader.load('/assets/antracite-realista.jpg', textura => {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura,
    color: 0x111111,
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.4,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.FrontSide
  });

  const paredeFundo = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), paredeMaterial);
  paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
  scene.add(paredeFundo);

  const paredeEsq = new THREE.Mesh(new THREE.PlaneGeometry(30, 28), paredeMaterial);
  paredeEsq.position.set(-14.6, 13.4, -config.wallDistance / 2);
  paredeEsq.rotation.y = Math.PI / 2;
  scene.add(paredeEsq);

  const paredeDir = new THREE.Mesh(new THREE.PlaneGeometry(30, 28), paredeMaterial);
  paredeDir.position.set(14.6, 13.4, -config.wallDistance / 2);
  paredeDir.rotation.y = -Math.PI / 2;
  scene.add(paredeDir);
});

// Reposicionamento preciso das obras laterais
const obrasLaterais = [
  { src: '/assets/obras/obra-lateral-esquerda.jpg', x: -12, y: 9.1, z: -config.wallDistance / 2, rotY: Math.PI / 2 },
  { src: '/assets/obras/obra-lateral-direita.jpg', x: 12, y: 9.1, z: -config.wallDistance / 2, rotY: -Math.PI / 2 }
];
obrasLaterais.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);
  const grupo = new THREE.Group();
  const moldura = new THREE.Mesh(new THREE.BoxGeometry(4.7, 6.7, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e1a16, metalness: 0.6, roughness: 0.3, emissive: 0x0d0c0a, emissiveIntensity: 0.15 }));
  moldura.position.z = -0.1;
  grupo.add(moldura);
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.4), new THREE.MeshStandardMaterial({ map: textura, roughness: 0.2, metalness: 0.05 }));
  quadro.position.z = 0.01;
  grupo.add(quadro);
  grupo.position.set(x, y, z);
  grupo.rotation.y = rotY;
  scene.add(grupo);
});

// Vitrines com textura escura e gema azul
function criarVitrineRealista(x, z) {
  const alturaPedestal = 4.6;
  const alturaVitrine = 1.6;
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.05, alturaPedestal, 1.05), new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.5, metalness: 0.25 }));
  pedestal.position.set(x, alturaPedestal / 2, z);
  scene.add(pedestal);

  const vitrine = new THREE.Mesh(new THREE.BoxGeometry(1, alturaVitrine, 1), new THREE.MeshPhysicalMaterial({
    map: textureLoader.load('/assets/vitrine-escura.jpg'),
    metalness: 0.1,
    roughness: 0.05,
    transmission: 1,
    thickness: 0.42,
    transparent: true,
    opacity: 0.18,
    ior: 1.5,
    reflectivity: 0.7,
    clearcoat: 0.9
  }));
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2, z);
  scene.add(vitrine);

  const gema = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/gema-azul.png'),
    emissive: 0x3377cc,
    emissiveIntensity: 2.8,
    transparent: true,
    opacity: 0.95
  }));
  gema.position.set(x, alturaPedestal + alturaVitrine / 2 + 0.25, z);
  scene.add(gema);
}
criarVitrineRealista(-12, -1.8);
criarVitrineRealista(-12, 1.8);
criarVitrineRealista(12, -1.8);
criarVitrineRealista(12, 1.8);
// Lógica do destaque da obra e modal transparente
let obraSelecionada = null;
let isHighlighted = false;
const modal = document.querySelector('.art-modal');
const modalTitulo = document.getElementById('art-title');
const modalDescricao = document.getElementById('art-description');
const modalArtista = document.getElementById('art-artist');
const modalAno = document.getElementById('art-year');
const modalPreco = document.getElementById('art-price');
const botaoComprar = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');

function destacarObra(obra, dados) {
  if (isHighlighted) return;
  isHighlighted = true;
  obraSelecionada = obra;

  obra.renderOrder = 999;
  obra.material.depthTest = false;
  obra.material.depthWrite = false;

  const targetY = 4.8 + 0.02; // altura normal + 2 cm
  const targetZ = -config.wallDistance / 2;

  obra.scale.set(2, 2, 2);

  gsap.to(obra.position, {
    x: 0,
    y: targetY,
    z: targetZ,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(obra.rotation, {
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: mostrarModal
      });
    }
  });

  blurOverlay.classList.add('active');

  function mostrarModal() {
    modalTitulo.textContent = dados.titulo;
    modalDescricao.textContent = dados.descricao;
    modalArtista.textContent = dados.artista;
    modalAno.textContent = dados.ano;
    modalPreco.textContent = `${dados.preco} ETH`;

    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(obra.matrixWorld);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${y + 40}px`;
    modal.style.background = 'rgba(255, 255, 255, 0.02)';
    modal.style.border = 'none';
    modal.style.boxShadow = 'none';
    modal.style.display = 'flex';
  }
}

function restaurarObra() {
  if (!isHighlighted) return;
  isHighlighted = false;

  modal.style.display = 'none';
  modal.style.background = '';
  modal.style.border = '';
  modal.style.boxShadow = '';

  obraSelecionada.renderOrder = 0;
  obraSelecionada.material.depthTest = true;
  obraSelecionada.material.depthWrite = true;
  obraSelecionada.scale.set(1, 1, 1);

  gsap.to(obraSelecionada.position, {
    x: obraSelecionada.userData.originalPosition.x,
    y: obraSelecionada.userData.originalPosition.y,
    z: obraSelecionada.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(obraSelecionada.rotation, {
    y: obraSelecionada.userData.originalRotation.y,
    duration: 0.8,
    ease: 'power2.out'
  });

  blurOverlay.classList.remove('active');
}

// Clique fora para restaurar obra
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (isHighlighted) {
    if (!modal.contains(e.target)) {
      restaurarObra();
    }
    return;
  }

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(obrasNormais);
  if (intersects.length > 0) {
    const obra = intersects[0].object;
    const index = obrasNormais.indexOf(obra);
    const dados = dadosObras[index];
    destacarObra(obra, dados);
  }
});
// Animação contínua e destaque
function animate() {
  requestAnimationFrame(animate);
  const tempo = Date.now() * (isHighlighted ? -0.00006 : -0.00012);
  obrasNormais.forEach((obra, i) => {
    if (obra === obraSelecionada) return;
    const angulo = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(angulo) * config.circleRadius;
    const z = Math.sin(angulo) * config.circleRadius;
    obra.position.x = x;
    obra.position.z = z;
    obra.rotation.y = -angulo + Math.PI;
  });
  renderer.render(scene, camera);
}

// Texto NANdART com luz dedicada
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
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
  const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
  const texto = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({
    color: 0xc49b42,
    metalness: 1,
    roughness: 0.25,
    emissive: 0x2c1d07,
    emissiveIntensity: 0.45
  }));
  texto.position.set(-largura / 2, 15.5, -config.wallDistance - 3.98);
  scene.add(texto);
  const luzTexto = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
  luzTexto.position.set(0, 18, -config.wallDistance - 2);
  luzTexto.target = texto;
  scene.add(luzTexto);
  scene.add(luzTexto.target);
});

// Conexão Web3 e compra
async function toggleWalletConnection() {
  if (!window.ethereum) {
    alert('Por favor instale a MetaMask para conectar a carteira.');
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
      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${parseFloat(formattedBalance).toFixed(3)} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  } catch (err) {
    console.error('Erro ao conectar carteira:', err);
    alert('Erro ao conectar. Tente novamente.');
  }
}

async function buyHandler(dados) {
  if (!window.ethereum) {
    alert('Instala a MetaMask para adquirir esta obra.');
    return;
  }
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
      value: ethers.parseEther(dados.preco)
    });
    alert(`Transação enviada!\nHash: ${tx.hash}`);
    await tx.wait();
    alert('Compra confirmada! Obrigado.');
  } catch (err) {
    console.error('Erro na compra:', err);
    alert('Erro na compra. Tente novamente.');
  }
}

if (botaoComprar) {
  botaoComprar.addEventListener('click', () => {
    if (obraSelecionada) {
      const index = obrasNormais.indexOf(obraSelecionada);
      const dados = dadosObras[index];
      buyHandler(dados);
    }
  });
}

if (walletButton) walletButton.addEventListener('click', toggleWalletConnection);

window.addEventListener('load', async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0].address);
      const formattedBalance = ethers.formatEther(balance);
      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${parseFloat(formattedBalance).toFixed(3)} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  }
});

animate();
