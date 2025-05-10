import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ... (código anterior permanece igual até a definição do textureLoader)

const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";

// Função para carregar texturas com fallback
function loadTextureWithFallback(path, fallbackColor = 0x888888) {
  return new Promise((resolve) => {
    textureLoader.load(
      path,
      (texture) => resolve(texture),
      undefined,
      () => {
        console.error(`Failed to load texture: ${path}`);
        resolve(null);
      }
    );
  });
}

// Função principal assíncrona
async function initGallery() {
  try {
    // Carregar texturas primeiro
    const [texturaGema, premiumTexture, starTexture] = await Promise.all([
      loadTextureWithFallback('/assets/gemas/gema-azul.jpg.png'),
      loadTextureWithFallback('/assets/premium/premium1.jpg'),
      loadTextureWithFallback('/assets/premium/estrela-premium.png')
    ]);

    // Carregar texturas das obras
    const obraTextures = await Promise.all([
      "/assets/obras/obra1.jpg",
      "/assets/obras/obra2.jpg",
      "/assets/obras/obra3.jpg",
      "/assets/obras/obra4.jpg",
      "/assets/obras/obra5.jpg",
      "/assets/obras/obra6.jpg",
      "/assets/obras/obra7.jpg",
      "/assets/obras/obra8.jpg"
    ].map(path => loadTextureWithFallback(path)));

    // Criar vitrines
    criarVitrine(-8, -2, texturaGema);
    criarVitrine(-8, 2, texturaGema);
    criarVitrine(8, -2, texturaGema);
    criarVitrine(8, 2, texturaGema);

    // Criar obras normais
    const obrasNormais = [];
    obraTextures.forEach((texture, i) => {
      if (!texture) return;
      
      const ang = (i / obraTextures.length) * Math.PI * 2;
      
      const moldura = new THREE.Mesh(
        new THREE.BoxGeometry(config.obraSize + 0.12, config.obraSize + 0.12, 0.08),
        molduraMaterial.clone()
      );
      
      const obra = new THREE.Mesh(
        new THREE.PlaneGeometry(config.obraSize, config.obraSize),
        new THREE.MeshStandardMaterial({ 
          map: texture,
          roughness: 0.2,
          metalness: 0.05,
          side: THREE.DoubleSide
        })
      );
      obra.position.z = 0.05;
      
      const grupo = new THREE.Group();
      grupo.add(moldura);
      grupo.add(obra);
      grupo.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
      grupo.rotation.y = -ang + Math.PI;
      scene.add(grupo);
      obrasNormais.push(grupo);
    });

    // Criar obra premium (se as texturas carregaram)
    if (premiumTexture && starTexture) {
      const molduraPremium = new THREE.Mesh(
        new THREE.BoxGeometry(config.premiumSize + 0.2, config.premiumSize + 0.2, 0.15),
        molduraMaterial.clone()
      );

      const quadroPremium = new THREE.Mesh(
        new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
        new THREE.MeshStandardMaterial({ 
          map: premiumTexture,
          roughness: 0.1,
          metalness: 0.2,
          side: THREE.DoubleSide
        })
      );
      quadroPremium.position.z = 0.08;

      const estrelaPremium = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.2),
        new THREE.MeshStandardMaterial({ 
          map: starTexture,
          transparent: true,
          side: THREE.DoubleSide
        })
      );
      estrelaPremium.position.set(0.3, 0.3, 0.13);

      const grupoPremium = new THREE.Group();
      grupoPremium.add(molduraPremium);
      grupoPremium.add(quadroPremium);
      grupoPremium.add(estrelaPremium);
      grupoPremium.position.set(0, 5.8, 0);
      scene.add(grupoPremium);

      // Animação de flutuação premium
      gsap.to(grupoPremium.position, {
        y: 5.8 + 0.22,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      gsap.to(grupoPremium.rotation, {
        z: 0.05,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    // Iniciar animação
    animate();

  } catch (error) {
    console.error("Erro ao inicializar a galeria:", error);
  }
}

// Modificar a função criarVitrine para receber a textura como parâmetro
function criarVitrine(x, z, texturaGema) {
  if (!texturaGema) return;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
  );
  base.position.set(x, 0.5, z);
  scene.add(base);

  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xeeeeff, 
      transmission: 0.95, 
      ior: 1.52, 
      transparent: true,
      roughness: 0.05,
      thickness: 0.3
    })
  );
  vidro.position.set(x, 1.5, z);
  scene.add(vidro);

  const gema = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 32, 32),
    new THREE.MeshStandardMaterial({ 
      map: texturaGema,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x444488,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    })
  );
  gema.position.set(x, 1.5, z);
  scene.add(gema);

  const luz = new THREE.PointLight(0x88ccff, 3, 3);
  luz.position.set(x, 1.5, z);
  scene.add(luz);
}

// Função de animação (igual à anterior)
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Iniciar a galeria
initGallery();
