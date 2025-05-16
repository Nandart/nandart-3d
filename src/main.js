import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 🎛️ Configuração Geral da Cena
const config = {
  wallDistance: 17, // RECUADA para mais profundidade
  circleRadius: 6.5,
  obraSize: 2.1,
  maxObras: 15
};

const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// 🎥 Câmara com ângulo ligeiramente mais baixo e distância maior
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);
camera.position.set(0, 9.5, 24);
camera.lookAt(0, 6.5, 0);

// 🖥️ Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;
renderer.outputEncoding = THREE.sRGBEncoding;

// 🔁 Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
const obrasNormais = [];
const obrasSubstitutas = [];
const reflexos = [];
let indiceSubstituicao = 0;
let obraEmDestaque = null;
let rotacaoPausada = false;
let tempoAnterior = Date.now();

async function carregarObras() {
  try {
    const response = await fetch('/obras.json');
    const dados = await response.json();

    const visiveis = dados.visiveis || [];
    const substitutas = dados.substitutas || [];

    visiveis.forEach((nome, i) => {
      criarObraCircular(nome, i);
    });

    substitutas.forEach((nome) => {
      const textura = textureLoader.load(`/assets/obras/${nome}`, tex => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.encoding = THREE.sRGBEncoding;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
      });
      obrasSubstitutas.push({ nome, textura });
    });
  } catch (e) {
    console.error('Erro ao carregar obras.json:', e);
  }
}

function criarObraCircular(nome, index) {
  const textura = textureLoader.load(`/assets/obras/${nome}`, tex => {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
  });

  const geometry = new THREE.PlaneGeometry(config.obraSize, config.obraSize * 1.45);
  const material = new THREE.MeshStandardMaterial({
    map: textura,
    roughness: 0.3,
    metalness: 0.08,
    emissive: 0x000000,
    emissiveIntensity: 0.05,
    side: THREE.FrontSide,
    transparent: true
  });

  const obra = new THREE.Mesh(geometry, material);
  obra.userData.nome = nome;
  obra.castShadow = true;

  const angulo = (index / config.maxObras) * Math.PI * 2;
  const x = Math.cos(angulo) * config.circleRadius;
  const z = Math.sin(angulo) * config.circleRadius;
  const ry = -angulo + Math.PI;

  obra.position.set(x, 6.3, z);
  obra.rotation.y = ry;

  const reflexo = obra.clone();
  reflexo.scale.y *= -1;
  reflexo.material = material.clone();
  reflexo.material.opacity = 0.3;
  reflexo.material.transparent = true;
  reflexo.position.y = 0.01;
  reflexo.userData.targetPos = new THREE.Vector3(x, 0.01, z);
  reflexo.userData.targetRot = new THREE.Euler(0, ry, 0);
  obra.userData.reflexo = reflexo;

  scene.add(obra);
  scene.add(reflexo);

  obrasNormais.push(obra);
  reflexos.push(reflexo);
}
function animate() {
  requestAnimationFrame(animate);

  const tempoAtual = Date.now();
  const delta = (tempoAtual - tempoAnterior) * 0.00012;
  tempoAnterior = tempoAtual;

  obrasNormais.forEach((obra, i) => {
    const angulo = delta + (i / config.maxObras) * Math.PI * 2;
    const x = Math.cos(angulo) * config.circleRadius;
    const z = Math.sin(angulo) * config.circleRadius;
    const ry = -angulo + Math.PI;

    const intensidade = obra === obraEmDestaque ? 0.005 : 1;

    if (!rotacaoPausada || obra !== obraEmDestaque) {
      obra.position.x += (x - obra.position.x) * 0.05 * intensidade;
      obra.position.z += (z - obra.position.z) * 0.05 * intensidade;
      obra.rotation.y += (ry - obra.rotation.y) * 0.05 * intensidade;

      const reflexo = obra.userData.reflexo;
      if (reflexo) {
        reflexo.userData.targetPos.set(x, 0.01, z);
        reflexo.userData.targetRot.set(0, ry, 0);

        reflexo.position.lerp(reflexo.userData.targetPos, 0.05 * intensidade);
        reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.05 * intensidade;
      }
    }

    const passouRetaguarda = z > config.circleRadius - 0.5 && Math.abs(x) < 1.0;
    if (passouRetaguarda && obrasSubstitutas.length > 0) {
      const substituta = obrasSubstitutas[indiceSubstituicao % obrasSubstitutas.length];
      obra.material.map = substituta.textura;
      obra.material.needsUpdate = true;
      obra.userData.nome = substituta.nome;

      const reflexo = obra.userData.reflexo;
      if (reflexo) {
        reflexo.material.map = substituta.textura;
        reflexo.material.needsUpdate = true;
      }

      indiceSubstituicao++;
    }
  });

  renderer.render(scene, camera);
}
// 💡 Luz ambiente geral
const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.6);
scene.add(luzAmbiente);

// 🌌 Luz hemisférica suave
const luzHemisferica = new THREE.HemisphereLight(0xfff6e0, 0x202020, 3.2);
scene.add(luzHemisferica);

// ☀️ Luz direcional principal (com sombras)
const luzDirecional = new THREE.DirectionalLight(0xfff1d0, 4.2);
luzDirecional.position.set(5, 22, 10);
luzDirecional.castShadow = true;
luzDirecional.shadow.mapSize.set(2048, 2048);
scene.add(luzDirecional);

// 🌑 Luz direcional suave específica para sombras das obras circulantes
const luzSombraObras = new THREE.DirectionalLight(0xffffff, 1.2);
luzSombraObras.position.set(0, 15, 10); // Posicione acima e ligeiramente à frente das obras
luzSombraObras.target.position.set(0, 6.3, 0); // Apontar para o círculo das obras

// Ativar sombra
luzSombraObras.castShadow = true;
luzSombraObras.shadow.mapSize.width = 2048;  // Alta resolução para suavidade
luzSombraObras.shadow.mapSize.height = 2048;

luzSombraObras.shadow.camera.near = 5;
luzSombraObras.shadow.camera.far = 25;
luzSombraObras.shadow.camera.left = -8;
luzSombraObras.shadow.camera.right = 8;
luzSombraObras.shadow.camera.top = 8;
luzSombraObras.shadow.camera.bottom = -8;

luzSombraObras.shadow.bias = -0.0003;  // Evitar sombras com artefactos
luzSombraObras.shadow.radius = 3;      // Suavizar bordas da sombra

scene.add(luzSombraObras);
scene.add(luzSombraObras.target);

// 💠 Luz pulsante central no chão
const luzChao = new THREE.SpotLight(0xfff4cc, 2.2, 20, Math.PI / 6, 0.4);
luzChao.position.set(0, 6, 0);
luzChao.target.position.set(0, 0, 0);
scene.add(luzChao, luzChao.target);

gsap.to(luzChao, {
  intensity: 3.8,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// ✨ Spots e pontos de luz sobre vitrines e gemas
[
  { x: -9.5, z: -1.8 },
  { x: -9.5, z: 1.8 },
  { x: 9.5, z: -1.8 },
  { x: 9.5, z: 1.8 }
].forEach(({ x, z }) => {
  const spot = new THREE.SpotLight(0xadd8ff, 1.6, 5, Math.PI / 5, 0.3);
  spot.position.set(x, 4.5, z + 1.2);
  spot.target.position.set(x, 3.2, z);
  scene.add(spot, spot.target);

  const point = new THREE.PointLight(0xcfeaff, 1.7, 3.8);
  point.position.set(x, 5.6, z);
  scene.add(point);

  const interior = new THREE.PointLight(0x88bbff, 1.6, 1.6);
  interior.position.set(x, 3.65, z);
  scene.add(interior);
});

// 🔷 Geometria da gema
const texturaGema = textureLoader.load('/assets/gema-azul.jpg.png');
const geometriaGema = new THREE.OctahedronGeometry(0.4, 2);
const materialGema = new THREE.MeshStandardMaterial({
  map: texturaGema,
  metalness: 0.9,
  roughness: 0.05,
  emissive: 0x224477,
  emissiveIntensity: 0.35,
  transparent: true,
  opacity: 0.95
});

// 🟥 Geometria da vitrine de vidro
const geometriaVitrine = new THREE.CylinderGeometry(0.6, 0.6, 1.1, 32);
const materialVidro = new THREE.MeshPhysicalMaterial({
  color: 0xccccff,
  metalness: 0,
  roughness: 0.1,
  transparent: true,
  opacity: 0.25,
  transmission: 1.0,
  thickness: 0.1,
  envMapIntensity: 0.6
});

// 🟫 Geometria do pedestal
const geometriaPedestal = new THREE.CylinderGeometry(0.65, 0.65, 0.4, 24);
const materialPedestal = new THREE.MeshStandardMaterial({
  color: 0x444444,
  metalness: 0.3,
  roughness: 0.6
});

// 📍 Criar pedestais, vitrines e gemas
[
  { x: -9.5, z: -1.8 },
  { x: -9.5, z: 1.8 },
  { x: 9.5, z: -1.8 },
  { x: 9.5, z: 1.8 }
].forEach((pos) => {
  const pedestal = new THREE.Mesh(geometriaPedestal, materialPedestal);
  pedestal.position.set(pos.x, 0.2, pos.z);
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const vitrine = new THREE.Mesh(geometriaVitrine, materialVidro);
  vitrine.position.set(pos.x, 1.2, pos.z);
  scene.add(vitrine);

  const gema = new THREE.Mesh(geometriaGema, materialGema);
  gema.position.set(pos.x, 1.2, pos.z);
  gema.castShadow = true;
  scene.add(gema);

  const reflexo = gema.clone();
  reflexo.scale.y = -1;
  reflexo.material = gema.material.clone();
  reflexo.material.opacity = 0.3;
  reflexo.material.emissiveIntensity = 0.2;
  reflexo.position.y = 0.01;
  scene.add(reflexo);
});

// 🎨 Materiais para molduras exterior e interior dos frisos laterais
const materialMolduraExterior = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.1,
  emissive: 0x332200,
  emissiveIntensity: 0.3
});

const materialMolduraInterior = new THREE.MeshStandardMaterial({
  color: 0xfbe7b2,
  metalness: 0.8,
  roughness: 0.2,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.35
});

// 🟧 Função para criar frisos laterais duplos embutidos com TubeGeometry
function criarFrisoLateral(pontos, material) {
  const curva = new THREE.CatmullRomCurve3(pontos, true);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curva, 64, 0.02, 12, true),
    material
  );
}

// ➕ Moldura lateral esquerda (exterior + interior)
const molduraExtEsq = criarFrisoLateral([
  new THREE.Vector3(-15.2, 2.0, -config.wallDistance + 0.021),
  new THREE.Vector3(-15.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(-11.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(-11.2, 2.0, -config.wallDistance + 0.021)
], materialMolduraExterior);
scene.add(molduraExtEsq);

const molduraIntEsq = criarFrisoLateral([
  new THREE.Vector3(-14.7, 2.6, -config.wallDistance + 0.022),
  new THREE.Vector3(-14.7, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(-11.8, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(-11.8, 2.6, -config.wallDistance + 0.022)
], materialMolduraInterioresquerda);
scene.add(molduraIntEsq);

// ➕ Moldura lateral direita (exterior + interior)
const molduraExtDir = criarFrisoLateral([
  new THREE.Vector3(15.2, 2.0, -config.wallDistance + 0.021),
  new THREE.Vector3(15.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(11.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(11.2, 2.0, -config.wallDistance + 0.021)
], materialMolduraExterior);
scene.add(molduraExtDir);

const molduraIntDir = criarFrisoLateral([
  new THREE.Vector3(14.7, 2.6, -config.wallDistance + 0.022),
  new THREE.Vector3(14.7, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(11.8, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(11.8, 2.6, -config.wallDistance + 0.022)
], materialMolduraInteriordireita);
scene.add(molduraIntDir);

// 🟨 Moldura retangular arredondada da parede central (friso quadro central)
const formatoFrisoCentral = new THREE.Shape();
const larguraFriso = 4.0;
const alturaFriso = 5.0;
const raio = 0.3;

formatoFrisoCentral.moveTo(-larguraFriso / 2 + raio, -alturaFriso / 2);
formatoFrisoCentral.lineTo(larguraFriso / 2 - raio, -alturaFriso / 2);
formatoFrisoCentral.quadraticCurveTo(larguraFriso / 2, -alturaFriso / 2, larguraFriso / 2, -alturaFriso / 2 + raio);
formatoFrisoCentral.lineTo(larguraFriso / 2, alturaFriso / 2 - raio);
formatoFrisoCentral.quadraticCurveTo(larguraFriso / 2, alturaFriso / 2, larguraFriso / 2 - raio, alturaFriso / 2);
formatoFrisoCentral.lineTo(-larguraFriso / 2 + raio, alturaFriso / 2);
formatoFrisoCentral.quadraticCurveTo(-larguraFriso / 2, alturaFriso / 2, -larguraFriso / 2, alturaFriso / 2 - raio);
formatoFrisoCentral.lineTo(-larguraFriso / 2, -alturaFriso / 2 + raio);
formatoFrisoCentral.quadraticCurveTo(-larguraFriso / 2, -alturaFriso / 2, -larguraFriso / 2 + raio, -alturaFriso / 2);

const extrudeSettings = {
  depth: 0.04,
  bevelEnabled: true,
  bevelThickness: 0.01,
  bevelSize: 0.015,
  bevelSegments: 4,
  steps: 1
};

const geometriaFrisoCentral = new THREE.ExtrudeGeometry(formatoFrisoCentral, extrudeSettings);
const frisoQuadroCentral = new THREE.Mesh(geometriaFrisoCentral, materialMolduraExterior);
frisoQuadroCentral.position.set(0, 7.8, -config.wallDistance + 0.022);
scene.add(frisoQuadroCentral);

// ✍️ Nome NANdART em relevo elegante na parede de fundo
const loaderFonte = new FontLoader();
loaderFonte.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (fonte) {
  const geometriaTexto = new TextGeometry('NANdART', {
    font: fonte,
    size: 1.4,
    height: 0.15,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 5
  });

  const materialTexto = new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x2c1e0d,
    emissiveIntensity: 0.25
  });

  const textoMesh = new THREE.Mesh(geometriaTexto, materialTexto);
  geometriaTexto.center();

  textoMesh.position.set(0, 18.5, -config.wallDistance + 0.01);
  scene.add(textoMesh);
});
// 🟫 CHÃO com material reflexivo e aspecto obsidiana líquida
const geometriaChao = new THREE.PlaneGeometry(50, 40);
const materialChao = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.6,
  roughness: 0.2
});
const chao = new THREE.Mesh(geometriaChao, materialChao);
chao.rotation.x = -Math.PI / 2;
chao.position.y = 0;
chao.receiveShadow = true;
scene.add(chao);

// 🔵 Círculo de luz totalmente visível no chão (como um halo subtil)
const circuloLuzGeometry = new THREE.CircleGeometry(4, 64);
const circuloLuzMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffe0,
  opacity: 0.12,
  transparent: true
});
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.set(0, 0.011, 0);
scene.add(circuloLuz);

// 🟧 Função para criar frisos laterais duplos embutidos com TubeGeometry
function criarFrisoLateral(pontos, material) {
  const curva = new THREE.CatmullRomCurve3(pontos, true);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curva, 64, 0.02, 12, true),
    material
  );
}

// ➕ Moldura lateral esquerda (exterior + interior)
const molduraExtEsq = criarFrisoLateralesq([
  new THREE.Vector3(-15.2, 2.0, -config.wallDistance + 0.021),
  new THREE.Vector3(-15.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(-11.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(-11.2, 2.0, -config.wallDistance + 0.021)
], materialMolduraExterior);
scene.add(molduraExtEsq);

const molduraIntEsq = criarFrisoLateralesq_([
  new THREE.Vector3(-14.7, 2.6, -config.wallDistance + 0.022),
  new THREE.Vector3(-14.7, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(-11.8, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(-11.8, 2.6, -config.wallDistance + 0.022)
], materialMolduraInterior);
scene.add(molduraIntEsq);

// ➕ Moldura lateral direita (exterior + interior)
const molduraExtDir = criarFrisoLateraldir([
  new THREE.Vector3(15.2, 2.0, -config.wallDistance + 0.021),
  new THREE.Vector3(15.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(11.2, 13.8, -config.wallDistance + 0.021),
  new THREE.Vector3(11.2, 2.0, -config.wallDistance + 0.021)
], materialMolduraExterior);
scene.add(molduraExtDir);

const molduraIntDir = criarFrisoLateraldir_([
  new THREE.Vector3(14.7, 2.6, -config.wallDistance + 0.022),
  new THREE.Vector3(14.7, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(11.8, 13.2, -config.wallDistance + 0.022),
  new THREE.Vector3(11.8, 2.6, -config.wallDistance + 0.022)
], materialMolduraInterior);
scene.add(molduraIntDir);
// 🔷 Geometria e material da gema (cristal azul translúcido)
const texturaGema = textureLoader.load('/assets/gema-azul.jpg.png');
const geometriaGema = new THREE.OctahedronGeometry(0.4, 2);
const materialGema = new THREE.MeshStandardMaterial({
  map: texturaGema,
  metalness: 0.9,
  roughness: 0.05,
  emissive: 0x224477,
  emissiveIntensity: 0.35,
  transparent: true,
  opacity: 0.95
});

// 🟥 Geometria da vitrine de vidro cilíndrica, com suavidade nas bordas e transparência elegante
const geometriaVitrine = new THREE.CylinderGeometry(0.6, 0.6, 1.1, 32);
const materialVidro = new THREE.MeshPhysicalMaterial({
  color: 0xccccff,
  metalness: 0,
  roughness: 0.1,
  transparent: true,
  opacity: 0.25,
  transmission: 1.0,
  thickness: 0.1,
  envMapIntensity: 0.6
});

// 🟫 Pedestal cilindrico com cor escura e textura mate, simples e robusto
const geometriaPedestal = new THREE.CylinderGeometry(0.65, 0.65, 0.4, 24);
const materialPedestal = new THREE.MeshStandardMaterial({
  color: 0x444444,
  metalness: 0.3,
  roughness: 0.6
});

// 📍 Posições exatas dos pedestais conforme layout: quatro pontos estratégicos
const posicoes = [
  { x: -9.5, z: -1.8 },
  { x: -9.5, z: 1.8 },
  { x: 9.5, z: -1.8 },
  { x: 9.5, z: 1.8 }
];

posicoes.forEach((pos) => {
  // Criar pedestal robusto e simples
  const pedestal = new THREE.Mesh(geometriaPedestal, materialPedestal);
  pedestal.position.set(pos.x, 0.2, pos.z);
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  // Criar vitrine de vidro cilíndrica sobre o pedestal
  const vitrine = new THREE.Mesh(geometriaVitrine, materialVidro);
  vitrine.position.set(pos.x, 1.2, pos.z);
  vitrine.castShadow = false;
  vitrine.receiveShadow = false;
  scene.add(vitrine);

  // Criar gema cristalina translúcida no centro da vitrine
  const gema = new THREE.Mesh(geometriaGema, materialGema);
  gema.position.set(pos.x, 1.2, pos.z);
  gema.castShadow = true;
  gema.receiveShadow = false;
  scene.add(gema);

  // Reflexo subtil da gema no chão, invertido e translúcido
  const reflexo = gema.clone();
  reflexo.scale.y = -1;
  reflexo.material = gema.material.clone();
  reflexo.material.opacity = 0.3;
  reflexo.material.emissiveIntensity = 0.2;
  reflexo.position.y = 0.01;
  scene.add(reflexo);
});
// 🟫 Chão com material reflexivo e visível, cor preta profunda e acabamento ligeiramente mate
const geometriaChao = new THREE.PlaneGeometry(50, 40);
const materialChao = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.6,
  roughness: 0.2
});
const chao = new THREE.Mesh(geometriaChao, materialChao);
chao.rotation.x = -Math.PI / 2;
chao.position.y = 0;
chao.receiveShadow = true;
scene.add(chao);

// 🔵 Círculo de luz no chão, com cor quente, baixa opacidade e transparência subtil
const circuloLuzGeometry = new THREE.CircleGeometry(4, 64);
const circuloLuzMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffe0,
  opacity: 0.12,
  transparent: true
});
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.set(0, 0.011, 0);
scene.add(circuloLuz);

// ⬛ Teto visível com tom neutro e iluminação suave, pintado em cinzento escuro
const geometriaTeto = new THREE.PlaneGeometry(50, 40);
const materialTeto = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.8,
  metalness: 0.1,
  side: THREE.BackSide
});
const teto = new THREE.Mesh(geometriaTeto, materialTeto);
teto.rotation.x = Math.PI / 2;
teto.position.y = 26.5;
scene.add(teto);
// 💡 Luz suave e ampla no teto para iluminar a galeria
const luzTeto = new THREE.RectAreaLight(0xfff7dd, 2.2, 22, 18);
luzTeto.position.set(0, 25.8, -config.wallDistance);
luzTeto.lookAt(0, 12, -config.wallDistance);
scene.add(luzTeto);
// 🟫 Paredes laterais com textura realista, repetição suave, e iluminação adaptada
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');
texturaParede.wrapS = texturaParede.wrapT = THREE.RepeatWrapping;
texturaParede.repeat.set(2, 2);
texturaParede.encoding = THREE.sRGBEncoding;

const materialParede = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.4,
  metalness: 0.2
});

const larguraParede = 30;
const alturaParede = 20;

// Parede esquerda posicionada verticalmente com rotação de 90 graus no eixo Y
const paredeEsquerda = new THREE.Mesh(
  new THREE.PlaneGeometry(alturaParede, larguraParede),
  materialParede
);
paredeEsquerda.position.set(-15, alturaParede / 2, 0);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);

// Parede direita, espelhada da esquerda
const paredeDireita = new THREE.Mesh(
  new THREE.PlaneGeometry(alturaParede, larguraParede),
  materialParede
);
paredeDireita.position.set(15, alturaParede / 2, 0);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);
// Fundo (atrás da obra central), sem luz direcional ou spot sobre o quadro
const paredeFundo = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraParede, alturaParede),
  materialParede
);
paredeFundo.position.set(0, alturaParede / 2, -config.wallDistance / 2 - 2); // Empurrar mais para trás para profundidade
scene.add(paredeFundo);

// Removidas quaisquer luzes direcionais ou spot específicas para o quadro central para evitar iluminação direta

