// Importações
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ethers } from 'ethers';

// Cena e Renderização
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2.5;
controls.minPolarAngle = Math.PI / 2.5;

// Textura Procedimental para o Chão e Paredes
const createGridTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 4;
  
  for (let i = 0; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  
  return new THREE.CanvasTexture(canvas);
};

const gridTexture = createGridTexture();
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(4, 4);

const floorMaterial = new THREE.MeshStandardMaterial({ 
  map: gridTexture, 
  roughness: 0.3, 
  metalness: 0.8 
});

const wallMaterial = new THREE.MeshStandardMaterial({ 
  map: gridTexture, 
  roughness: 0.5, 
  metalness: 0.3 
});

// Geometrias
const floorGeometry = new THREE.PlaneGeometry(40, 80);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const wallGeometry = new THREE.PlaneGeometry(80, 5);
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-5, 2.5, 0);
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = leftWall.clone();
rightWall.position.x = 5;
scene.add(rightWall);

// Iluminação
const ambientLight = new THREE.AmbientLight(0x00ffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(0, 4.5, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
scene.add(pointLight);

// Linha Neon
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
const lineGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 4.9, -40), 
  new THREE.Vector3(0, 4.9, 40)
]);
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

// Molduras Neon
const frameMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x111, 
  emissive: 0x00ffff, 
  emissiveIntensity: 1, 
  metalness: 0.5, 
  roughness: 0.3 
});

const frameGeometry = new THREE.BoxGeometry(2, 2, 0.1);
const framePositions = [-15, -5, 5, 15];

framePositions.forEach(z => {
  const frameLeft = new THREE.Mesh(frameGeometry, frameMaterial);
  frameLeft.position.set(-4.9, 2.5, z);
  frameLeft.rotation.y = Math.PI / 2;
  frameLeft.castShadow = true;
  scene.add(frameLeft);

  const frameRight = frameLeft.clone();
  frameRight.position.x = 4.9;
  frameRight.rotation.y = -Math.PI / 2;
  scene.add(frameRight);
});

// Animação
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Gerenciamento de Resize
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);

// Conexão com Wallet
function createWalletButton() {
  const button = document.createElement('button');
  button.id = 'wallet-button';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px 20px;
    background: #00ffff;
    color: #000;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    z-index: 100;
    transition: all 0.3s ease;
  `;
  button.textContent = 'Connect Wallet';
  document.body.appendChild(button);
  return button;
}

const walletButton = createWalletButton();

let provider;
let signer;
let connectedAddress = '';

async function connectWallet() {
  try {
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      connectedAddress = accounts[0];
      
      const balance = await provider.getBalance(connectedAddress);
      const ethBalance = ethers.utils.formatEther(balance).slice(0, 6);
      
      walletButton.textContent = `${connectedAddress.slice(0, 6)}... | ${ethBalance} ETH`;
      walletButton.style.background = '#ff5555';
      
      console.log('Connected:', connectedAddress);
    } else {
      alert('Please install MetaMask!');
    }
  } catch (error) {
    console.error('Connection error:', error);
    alert('Connection failed: ' + error.message);
  }
}

function disconnectWallet() {
  provider = null;
  signer = null;
  connectedAddress = '';
  walletButton.textContent = 'Connect Wallet';
  walletButton.style.background = '#00ffff';
}

walletButton.addEventListener('click', () => {
  connectedAddress ? disconnectWallet() : connectWallet();
});

// Inicialização
function init() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  animate();
  
  // Cleanup on unmount
  return () => {
    window.removeEventListener('resize', handleResize);
    if (walletButton.parentNode) {
      walletButton.parentNode.removeChild(walletButton);
    }
  };
}

// Start the application
init();
