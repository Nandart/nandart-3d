import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';

// Caminhos das obras
const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
  "./assets/obras/obra4.jpg",
  "./assets/obras/obra5.jpg",
  "./assets/obras/obra6.jpg"
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 8, 0.2, 1);
spotlight.position.set(0, 8, 6);
spotlight.castShadow = true;
scene.add(spotlight);

// Chão
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x050505, shininess: 100, reflectivity: 0.8 });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Moldura elegante
function criarQuadroComMoldura(texture, largura, altura) {
  const quadro = new THREE.Group();

  const geoQuadro = new THREE.PlaneGeometry(largura, altura);
  const matQuadro = new THREE.MeshBasicMaterial({ map: texture });
  const planoQuadro = new THREE.Mesh(geoQuadro, matQuadro);
  quadro.add(planoQuadro);

  const molduraGeo = new THREE.PlaneGeometry(largura + 0.1, altura + 0.1);
  const molduraMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.BackSide });
  const moldura = new THREE.Mesh(molduraGeo, molduraMat);
  quadro.add(moldura);

  return quadro;
}

// Obras
const obrasNormais = [];
const raio = 3.5;

obraPaths.forEach((src, i) => {
  const tex = new THREE.TextureLoader().load(src);
  const quadro = criarQuadroComMoldura(tex, 0.6, 0.6); // metade do tamanho
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  quadro.position.set(Math.cos(angulo) * raio, 1.5, Math.sin(angulo) * raio);
  quadro.rotation.y = -angulo + Math.PI;
  quadro.userData.tipo = 'normal';
  scene.add(quadro);
  obrasNormais.push(quadro);
});

// Obra premium
const texPremium = new THREE.TextureLoader().load('./assets/premium/premium1.jpg');
const premium = criarQuadroComMoldura(texPremium, 0.7, 0.7);
premium.position.set(0, 3.2, 0);
premium.userData.tipo = 'premium';
scene.add(premium);

// Estrela premium
const estrelaGeo = new THREE.PlaneGeometry(0.1, 0.1);
const estrelaTex = new THREE.TextureLoader().load('./assets/icones/estrela.png');
const estrelaMat = new THREE.MeshBasicMaterial({ map: estrelaTex, transparent: true });
const estrela = new THREE.Mesh(estrelaGeo, estrelaMat);
estrela.position.set(0.35, 0.35, 0.01);
premium.add(estrela);

// Responsivo
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação
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

// Interatividade
renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);

function onClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX || event.touches[0]?.clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches[0]?.clientY) / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium], true);

  if (intersects.length > 0) {
    const obra = intersects[0].object.parent;
    destacarObra(obra);
  }
}

function destacarObra(obra) {
  const clone = obra.clone();
  clone.children.forEach(c => c.material = c.material.clone());
  scene.add(clone);
  clone.position.copy(obra.position);
  clone.scale.set(1, 1, 1);
  clone.rotation.copy(obra.rotation);

  gsap.to(clone.position, { x: 0, y: 2.2, z: 1, duration: 0.8 });
  gsap.to(clone.rotation, { y: 0, duration: 0.8 });
  gsap.to(clone.scale, { x: 1.6, y: 1.6, duration: 0.8 });

  gsap.to(scene.background, { r: 0.08, g: 0.08, b: 0.08, duration: 0.5 });

  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '20px';
  modal.style.right = '20px';
  modal.style.padding = '15px';
  modal.style.background = 'rgba(255,255,255,0.9)';
  modal.style.border = '1px solid #ccc';
  modal.style.borderRadius = '8px';
  modal.style.zIndex = 999;
  modal.innerHTML = `<strong>Obra em destaque</strong><br><button onclick="alert('Compra simulada!')">Comprar</button>`;
  document.body.appendChild(modal);

  setTimeout(() => {
    gsap.to(clone.position, { z: obra.position.z, duration: 0.6, onComplete: () => scene.remove(clone) });
    gsap.to(clone.scale, { x: 1, y: 1, duration: 0.6 });
    gsap.to(scene.background, { r: 0.13, g: 0.13, b: 0.13, duration: 0.6 });
    document.body.removeChild(modal);
  }, 4000);
}