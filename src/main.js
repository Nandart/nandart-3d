import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/objects/Reflector.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/geometries/TextGeometry.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';
import { MotionPathPlugin } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/MotionPathPlugin.js';


gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ✅ DEFINIÇÃO DO FONT LOADER (corrigido aqui)
const fontLoader = new FontLoader();

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 1.2, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 1.35, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 1.5, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 1.65, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
// Iluminação com ambiente realista e difuso
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.25);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.25);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.2);
scene.add(luzHemisferica);

// ✨ Cor dourada realista (RGB 138, 92, 33)
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: new THREE.Color(0x3a240a),
  emissiveIntensity: 0.3
});

// 🖼️ Quadro central aumentado com presença destacada
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroDecorativoFundo = new THREE.Group();
const larguraQuadro = 7.2;
const alturaQuadro = 9.0;

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);
quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance + 0.001);
scene.add(quadroDecorativoFundo);

// Frisos rectangulares com contorno arredondado
const frisoTopo = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 0.02), frisoMaterial);
frisoTopo.position.set(0, 10.2, -config.wallDistance + 0.01);
scene.add(frisoTopo);

const frisoBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 0.02), frisoMaterial);
frisoBase.position.set(0, 4.6, -config.wallDistance + 0.01);
scene.add(frisoBase);

const frisoEsquerda = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.6, 16), frisoMaterial);
frisoEsquerda.rotation.z = Math.PI / 2;
frisoEsquerda.position.set(-2.28, 7.4, -config.wallDistance + 0.01);
scene.add(frisoEsquerda);

const frisoDireita = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.6, 16), frisoMaterial);
frisoDireita.rotation.z = Math.PI / 2;
frisoDireita.position.set(2.28, 7.4, -config.wallDistance + 0.01);
scene.add(frisoDireita);

// Friso horizontal interno paralelo no topo
const frisoInternoTopo = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.055, 0.02), frisoMaterial);
frisoInternoTopo.position.set(0, 9.65, -config.wallDistance + 0.011);
scene.add(frisoInternoTopo);
// 🟫 Frisos horizontais inferiores — parede de fundo e continuidade lateral
const frisoInferiorCentro = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorCentro.position.set(0, 0.62, -config.wallDistance + 0.015);
scene.add(frisoInferiorCentro);

const frisoInferiorEsquerdo = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorEsquerdo.position.set(-16.2, 0.62, -config.wallDistance / 2);
frisoInferiorEsquerdo.rotation.y = Math.PI / 2;
scene.add(frisoInferiorEsquerdo);

const frisoInferiorDireito = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorDireito.position.set(16.2, 0.62, -config.wallDistance / 2);
frisoInferiorDireito.rotation.y = -Math.PI / 2;
scene.add(frisoInferiorDireito);

// 🪞 Plano do chão com reflexo
const floor = new Reflector(
  new THREE.PlaneGeometry(100, 100),
  {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x111111
  }
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0.01;
scene.add(floor);

// 🌫️ Chão mais reflexivo e translúcido
floor.material.opacity = 0.75;
floor.material.roughness = 0.015;
floor.material.metalness = 1.0;
floor.material.transparent = true;
floor.material.reflectivity = 1.0;
floor.material.envMapIntensity = 1.6;

// ✨ Nome NANdART com dourado vivo e relevo iluminado
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: config.textSize,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.018,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8a5c21),
        metalness: 1,
        roughness: 0.15,
        emissive: new THREE.Color(0x3a240a),
        emissiveIntensity: 0.35
      })
    );

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    // Luz dedicada com foco suave
    const luzTexto = new THREE.SpotLight(0xffe7aa, 1.6, 14, Math.PI / 10, 0.5);
    luzTexto.position.set(0, 18.2, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// 💡 Iluminação suave e cálida para a obra central
const luzObraCentral = new THREE.SpotLight(0xfff1dd, 0.7, 13, Math.PI / 9, 0.4);
luzObraCentral.position.set(0, 13.2, -config.wallDistance + 1.5);
luzObraCentral.target = quadroDecorativoFundo;
scene.add(luzObraCentral);
scene.add(luzObraCentral.target);

// 🖼️ Quadros laterais — aumentados e com moldura saliente
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const largura = 4.4;
  const altura = 6.4;
  const espessura = 0.12;

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.2, altura + 0.2, espessura),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x8a5c20),
      metalness: 1,
      roughness: 0.15,
      emissive: new THREE.Color(0x2a1a08),
      emissiveIntensity: 0.35
    })
  );
  moldura.position.set(x, y, z);
  moldura.rotation.y = rotY;
  scene.add(moldura);

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );
  quadro.position.set(x, y, z + 0.065);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);

  const focoObra = new THREE.SpotLight(0xfff3d0, 0.5, 6, Math.PI / 9, 0.4);
  focoObra.position.set(x, y + 3.5, z + (rotY > 0 ? 2 : -2));
  focoObra.target = quadro;
  scene.add(focoObra);
  scene.add(focoObra.target);
});

// 🌀 Obras suspensas em círculo com reflexos no chão
const obrasNormais = [];
const numeroObras = 8;

for (let i = 1; i <= numeroObras; i++) {
  const texturaObra = textureLoader.load(`/assets/obras/obra${i}.jpg`);
  const largura = config.obraSize * 0.75;
  const altura = config.obraSize;

  const planoObra = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: texturaObra,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  planoObra.castShadow = true;

  const reflexo = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: texturaObra,
      opacity: 0.45,
      transparent: true,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  reflexo.rotation.x = Math.PI;
  reflexo.scale.y = 0.3;
  reflexo.position.y = -0.01;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();
  planoObra.userData.reflexo = reflexo;

  scene.add(planoObra);
  scene.add(reflexo);
  obrasNormais.push(planoObra);
}

function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;

  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    obra.position.set(x, 4.2, z);
    obra.rotation.y = ry;

    const reflexo = obra.userData?.reflexo;
    if (reflexo) {
      reflexo.userData.targetPos.set(x, -0.01, z);
      reflexo.userData.targetRot.set(0, ry, 0);

      reflexo.position.lerp(reflexo.userData.targetPos, 0.1);
      reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.1;
    }
  });

  renderer.render(scene, camera);
}

animate();

// ✨ Reflexos vivos e pulsação subtil nas gemas, frisos e molduras

// Moldura da obra central – brilho oscilante suave
gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => (pintura.material.needsUpdate = true)
});

// Frisos dourados — pulsação contínua e delicada
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.color &&
    obj.material.color.getHex() === 0x8a5c21
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.4,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Gemas nas vitrines — vibração etérea
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.0,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});
// 🔄 Ajustes dinâmicos ao redimensionar a janela
window.addEventListener('resize', () => {
  config = configMap[getViewportLevel()];

  // Atualiza parâmetros da câmara com nova proporção e posicionamento
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();

  // Reajusta dimensões do renderizador
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
// 🧊 Vitrines realistas sobre pedestais com gemas interiores brilhantes
const vitrines = [];
const gemas = [];
const posicoesVitrines = [
  { x: -10.5, z: -4.8 },
  { x: -5.4, z: -4.8 },
  { x: 5.4, z: -4.8 },
  { x: 10.5, z: -4.8 }
];

const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

posicoesVitrines.forEach(({ x, z }) => {
  // Vitrine cilíndrica de vidro
  const vitrine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 1.3, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0,
      metalness: 0,
      transmission: 1,
      transparent: true,
      thickness: 1.1,
      opacity: 0.6,
      ior: 1.5,
      envMapIntensity: 1.2,
      reflectivity: 0.3
    })
  );
  vitrine.position.set(x, 2.45, z);
  scene.add(vitrine);
  vitrines.push(vitrine);

  // Gema interior com textura e brilho
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 2),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      metalness: 1,
      roughness: 0.05,
      emissive: new THREE.Color(0x3a84ff),
      emissiveIntensity: 1.6
    })
  );
  gema.position.set(x, 2.45, z);
  scene.add(gema);
  gemas.push(gema);

  // Iluminação direcional focada na gema
  const focoGema = new THREE.SpotLight(0x9ecfff, 1.4, 6, Math.PI / 6, 0.3);
  focoGema.position.set(x, 5.5, z + 0.2);
  focoGema.target = gema;
  scene.add(focoGema, focoGema.target);
});
// 🧱 Pedestais realistas sob cada vitrine com cor e forma fiel ao layout
const materialPedestal = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x2f2b27), // cor cinzenta quente do layout
  roughness: 0.35,
  metalness: 0.2
});

posicoesVitrines.forEach(({ x, z }) => {
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.9, 1.3, 32),
    materialPedestal
  );
  pedestal.position.set(x, 1.15, z);
  pedestal.receiveShadow = true;
  pedestal.castShadow = true;
  scene.add(pedestal);
});
// 💎 Objetos suspensos dentro das vitrines – cristais com reflexos e luz focal
const materialCristal = new THREE.MeshStandardMaterial({
  color: 0xb9e2f9,
  roughness: 0.08,
  metalness: 0.6,
  emissive: new THREE.Color(0x1f2e3a),
  emissiveIntensity: 0.25
});

posicoesVitrines.forEach(({ x, z }) => {
  const cristal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    materialCristal
  );
  cristal.position.set(x, 2.15, z);
  cristal.castShadow = true;
  cristal.receiveShadow = true;
  scene.add(cristal);

  // Luz focal direccionada para o cristal
  const focoCristal = new THREE.SpotLight(0xb9e2f9, 1.4, 5, Math.PI / 7, 0.3);
  focoCristal.position.set(x, 3.8, z + 0.2);
  focoCristal.target = cristal;
  focoCristal.castShadow = true;
  scene.add(focoCristal);
  scene.add(focoCristal.target);

  // Armazenar referência para animação luminosa posterior
  cristal.userData.tipo = 'gemaVitrine';
});
// 🧊 Vitrines sobre os pedestais – vidro translúcido com base metálica
const vidroMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1.0,
  thickness: 0.35,
  roughness: 0.08,
  metalness: 0.1,
  clearcoat: 1,
  transparent: true,
  opacity: 0.45,
  reflectivity: 0.7,
  ior: 1.52
});

const baseMetalicaMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  metalness: 1,
  roughness: 0.2
});

posicoesVitrines.forEach(({ x, z }) => {
  // Cilindro de vidro principal
  const vidro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 1.1, 32, 1, true),
    vidroMaterial
  );
  vidro.position.set(x, 2.65, z);
  vidro.castShadow = false;
  vidro.receiveShadow = true;
  scene.add(vidro);

  // Tampa superior discreta
  const topoVidro = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 32),
    vidroMaterial
  );
  topoVidro.rotation.x = -Math.PI / 2;
  topoVidro.position.set(x, 3.2, z);
  scene.add(topoVidro);

  // Base metálica de apoio
  const baseVidro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.05, 32),
    baseMetalicaMaterial
  );
  baseVidro.position.set(x, 2.1, z);
  baseVidro.receiveShadow = true;
  scene.add(baseVidro);
});
// 💎 Gemas dentro das vitrines – brilho interior e leve elevação
const corGema = new THREE.Color(0x3fa4e8);
const materialGema = new THREE.MeshStandardMaterial({
  color: corGema,
  metalness: 0.9,
  roughness: 0.1,
  emissive: new THREE.Color(0x113366),
  emissiveIntensity: 1.2,
  transparent: true,
  opacity: 0.85
});

posicoesVitrines.forEach(({ x, z }) => {
  // Gema icosaédrica realista
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 0),
    materialGema
  );
  gema.position.set(x, 2.75, z);
  gema.castShadow = true;
  gema.receiveShadow = false;
  scene.add(gema);

  // Reflexo da gema no chão (ligeiramente desfocado)
  const reflexoGema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({
      color: corGema,
      emissive: new THREE.Color(0x113366),
      emissiveIntensity: 0.6,
      opacity: 0.4,
      transparent: true
    })
  );
  reflexoGema.position.set(x, 0.01, z);
  reflexoGema.rotation.x = Math.PI;
  reflexoGema.scale.y = 0.3;
  reflexoGema.userData.targetPos = new THREE.Vector3();
  reflexoGema.userData.targetRot = new THREE.Euler();
  scene.add(reflexoGema);
});
