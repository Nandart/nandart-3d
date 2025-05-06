import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/geometries/TextGeometry.js';
//import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';

const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
  "./assets/obras/obra4.jpg",
  "./assets/obras/obra5.jpg",
  "./assets/obras/obra6.jpg"
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

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

// Chão reflexivo
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({
  color: 0x050505,
  shininess: 100,
  reflectivity: 0.5
});
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const paredeGeo = new THREE.PlaneGeometry(20, 10);
const paredeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
const parede = new THREE.Mesh(paredeGeo, paredeMat);
parede.position.set(0, 2.5, -10);
scene.add(parede);

// Texto NANdART
const fontLoader = new FontLoader();
fontLoader.load('./assets/fontes/helvetiker_regular.typeface.json', function (font) {
    // Criar geometria do texto
    const textGeo = new TextGeometry('NANdART', {
        font: font,
        size: 0.9,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3
    });

    // Criar material e mesh
    const textMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 1,
        roughness: 0.4
    });

    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(-3.8, 4.1, -9.9); // Ajustar posição conforme necessário
    scene.add(textMesh);
});

// Obras normais suspensas
const obrasNormais = [];
const raio = 3.5;

obraPaths.forEach((src, i) => {
  const tex = new THREE.TextureLoader().load(src);
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const geo = new THREE.PlaneGeometry(0.6, 0.6);
  const quadro = new THREE.Mesh(geo, mat);
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  quadro.position.set(Math.cos(angulo) * raio, 1.8, Math.sin(angulo) * raio);
  quadro.rotation.y = -angulo + Math.PI;
  quadro.userData.tipo = 'normal';
  scene.add(quadro);
  obrasNormais.push(quadro);
});

// Obra premium suspensa
const texPremium = new THREE.TextureLoader().load('./assets/premium/premium1.jpg');
const matPremium = new THREE.MeshBasicMaterial({ map: texPremium });
const geoPremium = new THREE.PlaneGeometry(0.7, 0.7);
const premium = new THREE.Mesh(geoPremium, matPremium);
premium.position.set(0, 2.9, 0);
premium.userData.tipo = 'premium';
scene.add(premium);

// Ícone de estrela (obra premium)
const estrelaGeo = new THREE.PlaneGeometry(0.1, 0.1);
const estrelaTex = new THREE.TextureLoader().load('./assets/icons/estrela-premium.png');
const estrelaMat = new THREE.MeshBasicMaterial({ map: estrelaTex, transparent: true });
const estrela = new THREE.Mesh(estrelaGeo, estrelaMat);
estrela.position.set(0.35, 3.25, 0.01);
scene.add(estrela);

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

// Interatividade — clique ou toque numa obra para abrir modal
renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);

function onClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX || event.touches?.[0].clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches?.[0].clientY) / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium]);

  if (intersects.length > 0) {
    destacarObra(intersects[0].object);
  }
}

function destacarObra(obra) {
  const clone = obra.clone();
  clone.material = obra.material.clone();
  scene.add(clone);
  clone.position.copy(obra.position);
  clone.scale.set(1, 1, 1);
  clone.rotation.y = 0;

  gsap.to(clone.position, { x: 0, y: 2.2, z: 1, duration: 0.8, ease: 'power2.out' });
  gsap.to(clone.scale, { x: 2.5, y: 2.5, duration: 0.8, ease: 'power2.out' });

  // Criar modal com botão de compra
  const modal = document.createElement('div');
  modal.id = 'modalObra';
  modal.innerHTML = `
    <button id="fecharModal">X</button>
    <h2>Obra destacada</h2>
    <button id="comprarBtn">Comprar</button>
  `;
  document.body.appendChild(modal);

  document.getElementById('fecharModal').onclick = () => {
    scene.remove(clone);
    modal.remove();
  };

  document.getElementById('comprarBtn').onclick = () => {
    alert("Função de compra em desenvolvimento.");
  };
}

// Paredes laterais
const paredeEsq = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 5),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
paredeEsq.position.set(-10, 2.5, 0);
paredeEsq.rotation.y = Math.PI / 2;
scene.add(paredeEsq);

const paredeDir = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 5),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
paredeDir.position.set(10, 2.5, 0);
paredeDir.rotation.y = -Math.PI / 2;
scene.add(paredeDir);

// Frisos dourados verticais
function criarFriso(x, y, z) {
  const geo = new THREE.PlaneGeometry(0.05, 5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
  const friso = new THREE.Mesh(geo, mat);
  friso.position.set(x, y, z);
  friso.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
  scene.add(friso);
}
[-9.99, 9.99].forEach(x => [-3, 0, 3].forEach(z => criarFriso(x, 2.5, z)));

// Vitrines com gemas (2 de cada lado)
function criarVitrineComGema(x, z) {
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2, roughness: 0.8 })
  );
  pedestal.position.set(x, 0.25, z);
  scene.add(pedestal);

  const vidro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.7, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      roughness: 0,
      transmission: 1,
      thickness: 0.1,
      side: THREE.DoubleSide
    })
  );
  vidro.position.set(x, 0.85, z);
  scene.add(vidro);

  const texturaGema = new THREE.TextureLoader().load('./assets/gemas/gema-azul.jpg.png');
  const geoGema = new THREE.OctahedronGeometry(0.18, 0);
  const matGema = new THREE.MeshStandardMaterial({ map: texturaGema, roughness: 0.2, metalness: 0.9 });
  const gema = new THREE.Mesh(geoGema, matGema);
  gema.position.set(x, 0.9, z);
  scene.add(gema);
}
[[-7.5, -3], [-7.5, 3], [7.5, -3], [7.5, 3]].forEach(([x, z]) => criarVitrineComGema(x, z));

// Teto escuro
const tetoGeo = new THREE.PlaneGeometry(20, 20);
const tetoMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const teto = new THREE.Mesh(tetoGeo, tetoMat);
teto.rotation.x = Math.PI / 2;
teto.position.set(0, 5, 0);
scene.add(teto);

// Luz ambiente extra
const luzSuave = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
luzSuave.position.set(0, 5, 0);
scene.add(luzSuave);

// Spots embutidos para foco
[
  [-5, 0], [0, 0], [5, 0],
  [-7.5, -3], [-7.5, 3],
  [7.5, -3], [7.5, 3]
].forEach(([x, z]) => {
  const spot = new THREE.SpotLight(0xffffff, 0.7, 10, Math.PI / 8, 0.3, 1);
  spot.position.set(x, 4.9, z);
  spot.target.position.set(x, 0.5, z);
  scene.add(spot);
  scene.add(spot.target);
});
