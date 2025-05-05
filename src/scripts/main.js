// Importação de módulos
// Corrigido para usar caminhos relativos ou CDN, dependendo do ambiente

//import * as THREE from 'three'; // Certifique-se de que o módulo 'three' está instalado via npm
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import gsap from 'gsap';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';

// Verificar o valor de BASE_URL
//console.log("BASE_URL:", import.meta.env.BASE_URL);
// Configurações iniciais
const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
 "./assets/obras/obra4.jpg",
 "./assets/obras/obra5.jpg",
 "./assets/obras/obra6.jpg"
];
/*
const obraPaths = [
  `${import.meta.env.BASE_URL}assets/obras/obra1.jpg`,
  `${import.meta.env.BASE_URL}assets/obras/obra2.jpg`,
  `${import.meta.env.BASE_URL}assets/obras/obra3.jpg`,
  `${import.meta.env.BASE_URL}assets/obras/obra4.jpg`,
  `${import.meta.env.BASE_URL}assets/obras/obra5.jpg`,
  `${import.meta.env.BASE_URL}assets/obras/obra6.jpg`
];

*/

// Cena e câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

// Verificar suporte ao WebGL
if (!THREE.WebGLRenderer) {
  alert("Seu navegador não suporta WebGL.");
}

// Renderizador
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Luz ambiente + spotlight
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 8, 0.2, 1);
spotlight.position.set(0, 8, 6);
spotlight.castShadow = true;
scene.add(spotlight);

// Chão reflexivo (obsidiana líquida)
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({
  color: 0x050505,
  shininess: 100,
  reflectivity: 0.8
});
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Lista de obras normais (placeholders)
const obrasNormais = [];
const raio = 3.5;

// Criar quadros suspensos em círculo
obraPaths.forEach((src, i) => {
  const tex = new THREE.TextureLoader().load(src);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const geo = new THREE.PlaneGeometry(1.2, 1.2);
  const quadro = new THREE.Mesh(geo, mat);
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  quadro.position.set(Math.cos(angulo) * raio, 1.8, Math.sin(angulo) * raio);
  quadro.rotation.y = -angulo + Math.PI;
  quadro.userData.tipo = 'normal';
  scene.add(quadro);
  obrasNormais.push(quadro);
});

// Obra premium suspensa (placeholder)
const texPremium = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/premium/premium1.jpg`);
const matPremium = new THREE.MeshBasicMaterial({ map: texPremium });
const geoPremium = new THREE.PlaneGeometry(1.4, 1.4);
const premium = new THREE.Mesh(geoPremium, matPremium);
premium.position.set(0, 2.6, 0);
premium.userData.tipo = 'premium';
scene.add(premium);

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua
function animate() {
  requestAnimationFrame(animate);

  obrasNormais.forEach((q, i) => {
    const angulo = Date.now() * 0.0002 + (i / obrasNormais.length) * Math.PI * 2;
    q.position.x = Math.cos(angulo) * raio;
    q.position.z = Math.sin(angulo) * raio;
    q.rotation.y = -angulo + Math.PI;
  });

  renderer.render(scene, camera);
}
animate();

// Interatividade — click ou touch numa obra para abrir modal
renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);

function onClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX || event.touches[0]?.clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches[0]?.clientY) / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium]);

  if (intersects.length > 0) {
    const obra = intersects[0].object;
    destacarObra(obra);
  } else {
    console.warn('Nenhuma obra válida foi selecionada.');
  }
}

// Função para modal animado
function destacarObra(obra) {
  const clone = obra.clone();
  clone.material = obra.material.clone();
  scene.add(clone);
  clone.position.copy(obra.position);
  clone.scale.set(1, 1, 1);

  gsap.to(clone.position, { x: 0, y: 2.2, z: 1, duration: 0.8, ease: 'power2.out' });
  gsap.to(clone.scale, { x: 2.5, y: 2.5, duration: 0.8, ease: 'power2.out' });

  // Embaciar fundo
  gsap.to(scene.background, { r: 0.05, g: 0.05, b: 0.05, duration: 0.5 });

  // Recolher após 4 segundos (exemplo)
  setTimeout(() => {
    gsap.to(clone.position, { z: obra.position.z, duration: 0.6, onComplete: () => scene.remove(clone) });
    gsap.to(clone.scale, { x: 1, y: 1, duration: 0.6 });
    gsap.to(scene.background, { r: 0.07, g: 0.07, b: 0.07, duration: 0.6 });
  }, 4000);
}

// Ocultar ícone de ajuda após 20 segundos
setTimeout(() => {
  const ajuda = document.getElementById('ajudaIcone');
  if (ajuda) ajuda.classList.add('ocultar');
}, 20000);
