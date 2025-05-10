import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

let scene, camera, renderer, controls;
let obras = [];
let cubos = [];
let modalAberta = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const config = {
  XS: {
    cameraZ: 24,
    cuboY: -0.3,
    obraY: 2.2,
    obraEscala: 1.1,
    premiumY: 3.5,
    reflexoY: -0.01,
    gemScale: 0.3
  },
  SM: {
    cameraZ: 25,
    cuboY: -0.2,
    obraY: 2.4,
    obraEscala: 1.2,
    premiumY: 3.7,
    reflexoY: -0.01,
    gemScale: 0.35
  },
  MD: {
    cameraZ: 27,
    cuboY: -0.1,
    obraY: 2.6,
    obraEscala: 1.3,
    premiumY: 4.0,
    reflexoY: -0.02,
    gemScale: 0.4
  },
  LG: {
    cameraZ: 28,
    cuboY: 0,
    obraY: 2.8,
    obraEscala: 1.4,
    premiumY: 4.3,
    reflexoY: -0.02,
    gemScale: 0.45
  }
};

function getConfig() {
  return config[getViewportLevel()];
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const { cameraZ } = getConfig();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 2.5, cameraZ);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(5, 10, 7);
  directional.castShadow = true;
  scene.add(directional);

  criarChao();
  criarCubosComGemas();
  carregarObrasSuspensas();
  animate();

  window.addEventListener('resize', onResize);
  window.addEventListener('pointerdown', onInteragir);
}
function criarChao() {
  const geometria = new THREE.PlaneGeometry(100, 100);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.8,
    metalness: 0.3
  });
  const chao = new THREE.Mesh(geometria, material);
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  scene.add(chao);
}

function criarCubosComGemas() {
  const { cuboY, gemScale } = getConfig();

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 5;
    const z = Math.sin(angle) * 5;

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    pedestal.position.set(x, cuboY, z);
    pedestal.castShadow = true;
    scene.add(pedestal);
    cubos.push(pedestal);

    const gema = new THREE.Mesh(
      new THREE.OctahedronGeometry(gemScale, 0),
      new THREE.MeshStandardMaterial({ color: 0x0077ff, emissive: 0x003366, roughness: 0.3, metalness: 0.8 })
    );
    gema.position.set(x, cuboY + 0.6, z);
    gema.castShadow = true;
    gema.userData = { tipo: 'gema', index: i };
    scene.add(gema);
  }
}

function carregarObrasSuspensas() {
  const loader = new THREE.TextureLoader();
  const { obraY, obraEscala, premiumY } = getConfig();

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 5;
    const z = Math.sin(angle) * 5;

    const textura = loader.load(`/assets/obras/obra${i + 1}.jpg`);
    const quadro = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.8),
      new THREE.MeshBasicMaterial({ map: textura, transparent: true })
    );
    quadro.position.set(x, obraY, z);
    quadro.lookAt(0, obraY, 0);
    quadro.scale.set(obraEscala, obraEscala, obraEscala);
    quadro.userData = { nome: `obra${i + 1}.jpg` };
    scene.add(quadro);
    obras.push(quadro);
  }

  const texturaPremium = loader.load('/assets/obras/obra-premium.jpg');
  const quadroPremium = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 2.1),
    new THREE.MeshBasicMaterial({ map: texturaPremium, transparent: true })
  );
  quadroPremium.position.set(0, premiumY, -6);
  quadroPremium.scale.set(obraEscala * 1.1, obraEscala * 1.1, obraEscala * 1.1);
  quadroPremium.userData = { nome: 'obra-premium.jpg', premium: true };
  scene.add(quadroPremium);
  obras.push(quadroPremium);
}

function onInteragir(evento) {
  if (modalAberta) return;

  pointer.x = (evento.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(evento.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(obras);

  if (intersects.length > 0) {
    const obra = intersects[0].object;
    abrirModal(obra.userData.nome);
  }
}

function abrirModal(nomeObra) {
  const modal = document.querySelector('.art-modal');
  const titulo = modal.querySelector('#art-title');
  const botao = modal.querySelector('#buy-art');

  titulo.textContent = nomeObra.replace('.jpg', '').replace('obra-', '').replace(/-/g, ' ');
  botao.onclick = () => alert(`Adquirir: ${nomeObra}`);
  modal.classList.add('visible');
  modalAberta = true;

  document.body.classList.add('desacelerar');
  modal.addEventListener('click', fecharModal, { once: true });
}

function fecharModal() {
  const modal = document.querySelector('.art-modal');
  modal.classList.remove('visible');
  modalAberta = false;
  document.body.classList.remove('desacelerar');
}

function onResize() {
  const { cameraZ } = getConfig();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.z = cameraZ;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

init();
