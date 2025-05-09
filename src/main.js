import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';

const isMobile = window.innerWidth < 768;
const config = {
  obraSize: isMobile ? 0.35 : 0.5,
  premiumSize: isMobile ? 0.6 : 0.75,
  circleRadius: isMobile ? 2.4 : 3.5,
  wallDistance: 10,
  cameraZ: 14,
  textSize: isMobile ? 0.5 : 0.65
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, config.cameraZ);
camera.lookAt(0, 2.5, 0);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Luzes
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Chão
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshPhongMaterial({ color: 0x050505, shininess: 100, reflectivity: 0.4 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(25, 16),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
backWall.position.set(0, 8, -config.wallDistance);
scene.add(backWall);

// Texto NANdART
const fontLoader = new FontLoader();
fontLoader.load('./assets/fontes/helvetiker_regular.typeface.json', (font) => {
  const geo = new TextGeometry('NANdART', {
    font: font,
    size: config.textSize,
    height: 0.05
  });
  geo.computeBoundingBox();
  const width = geo.boundingBox.max.x - geo.boundingBox.min.x;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 }));
  mesh.position.set(-width / 2, 9.2, -config.wallDistance + 0.05);
  scene.add(mesh);
});

// Obras
const obrasPaths = [
  './assets/obras/obra1.jpg',
  './assets/obras/obra2.jpg',
  './assets/obras/obra3.jpg',
  './assets/obras/obra4.jpg',
  './assets/obras/obra5.jpg',
  './assets/obras/obra6.jpg'
];
const obrasNormais = [];

obrasPaths.forEach((path, i) => {
  const tex = new THREE.TextureLoader().load(path);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(config.obraSize + 0.08, config.obraSize + 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  const grupo = new THREE.Group();
  grupo.add(frame);
  plane.position.z = 0.03;
  grupo.add(plane);

  const ang = (i / obrasPaths.length) * Math.PI * 2;
  grupo.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
  grupo.rotation.y = -ang + Math.PI;

  scene.add(grupo);
  obrasNormais.push(grupo);
});

// Obra premium
const texPremium = new THREE.TextureLoader().load('./assets/premium/premium1.jpg');
const obraPremium = new THREE.Mesh(
  new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
  new THREE.MeshStandardMaterial({ map: texPremium })
);
const molduraPremium = new THREE.Mesh(
  new THREE.BoxGeometry(config.premiumSize + 0.1, config.premiumSize + 0.1, 0.08),
  new THREE.MeshStandardMaterial({ color: 0xc4b582 })
);
const estrela = new THREE.Mesh(
  new THREE.PlaneGeometry(0.15, 0.15),
  new THREE.MeshStandardMaterial({ 
    map: new THREE.TextureLoader().load('./assets/icons/estrela-premium.png'),
    transparent: true 
  })
);
estrela.position.set(0.25, 0.25, 0.06);

const grupoPremium = new THREE.Group();
obraPremium.position.z = 0.04;
grupoPremium.add(molduraPremium, obraPremium, estrela);
grupoPremium.position.set(0, 6.2, 0);
scene.add(grupoPremium);

// Frisos dourados laterais
[[-10, -3], [-10, 0], [-10, 3], [10, -3], [10, 0], [10, 3]].forEach(([x, z]) => {
  const friso = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 5),
    new THREE.MeshBasicMaterial({ color: 0xd4af37 })
  );
  friso.position.set(x, 2.5, z);
  friso.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(friso);
});

// Vitrines com gemas
[[-7.5, -3], [-7.5, 3], [7.5, -3], [7.5, 3]].forEach(([x, z]) => {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  base.position.set(x, 0.25, z);

  const vidro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.7, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      transmission: 1,
      thickness: 0.1,
      side: THREE.DoubleSide
    })
  );
  vidro.position.set(x, 0.85, z);

  const gema = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load('./assets/gemas/gema-azul.jpg.png'),
      metalness: 0.9
    })
  );
  gema.position.set(x, 0.9, z);

  scene.add(base, vidro, gema);
});

// Teto
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
ceiling.position.set(0, 16, 0);
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

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
    const ang = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
    q.position.x = Math.cos(ang) * config.circleRadius;
    q.position.z = Math.sin(ang) * config.circleRadius;
    q.rotation.y = -ang + Math.PI;
  });

  renderer.render(scene, camera);
}
animate();
