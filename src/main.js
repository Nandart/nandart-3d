// Importações
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ethers } from 'ethers';

// Cena e Renderização
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2.5;
controls.minPolarAngle = Math.PI / 2.5;

// Textura Procedimental para o Chão e Paredes
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 512;
textureCanvas.height = 512;
const ctx = textureCanvas.getContext('2d');
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
const texture = new THREE.CanvasTexture(textureCanvas);

const floorMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, metalness: 0.8 });
const wallMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.3 });

// Criação das Geometrias
const floorGeometry = new THREE.PlaneGeometry(40, 80);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallGeometry = new THREE.PlaneGeometry(80, 5);
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-5, 2.5, 0);
scene.add(leftWall);

const rightWall = leftWall.clone();
rightWall.position.x = 5;
scene.add(rightWall);

// Luzes
const ambientLight = new THREE.AmbientLight(0x00ffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(0, 4.5, 0);
scene.add(pointLight);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 4.9, -40), new THREE.Vector3(0, 4.9, 40)]);
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

// Molduras Neon
const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x00ffff, emissiveIntensity: 1, metalness: 0.5, roughness: 0.3 });
const frameGeometry = new THREE.BoxGeometry(2, 2, 0.1);
const positions = [-15, -5, 5, 15];
positions.forEach(z => {
    const frameLeft = new THREE.Mesh(frameGeometry, frameMaterial);
    frameLeft.position.set(-4.9, 2.5, z);
    frameLeft.rotation.y = Math.PI / 2;
    scene.add(frameLeft);

    const frameRight = frameLeft.clone();
    frameRight.position.x = 4.9;
    frameRight.rotation.y = -Math.PI / 2;
    scene.add(frameRight);
});

// Animação
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Botão Connect Wallet com ethers.js
const walletButton = document.createElement('button');
walletButton.style.position = 'fixed';
walletButton.style.top = '10px';
walletButton.style.right = '10px';
walletButton.style.padding = '10px 20px';
walletButton.style.background = '#00ffff';
walletButton.style.color = '#000';
walletButton.style.border = 'none';
walletButton.style.fontSize = '16px';
walletButton.style.cursor = 'pointer';
walletButton.textContent = 'Connect Wallet';
document.body.appendChild(walletButton);

let provider;
let signer;
let connectedAddress = '';

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        connectedAddress = await signer.getAddress();
        const balance = await provider.getBalance(connectedAddress);
        const ethBalance = ethers.utils.formatEther(balance);
        walletButton.textContent = `Disconnect (${ethBalance} ETH)`;
    } else {
        alert('MetaMask not detected.');
    }
}

async function disconnectWallet() {
    provider = null;
    signer = null;
    connectedAddress = '';
    walletButton.textContent = 'Connect Wallet';
}

walletButton.addEventListener('click', () => {
    if (!connectedAddress) {
        connectWallet();
    } else {
        disconnectWallet();
    }
});
