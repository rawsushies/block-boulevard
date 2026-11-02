import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTileDecalTexture, loadGameTexture, TEXTURE_URLS } from '../assets/textures';
import { BOARD_TILES, DISTRICTS, formatRupiah, getTileGridPosition } from '../game/boardData';
import { getEffectiveDevelopmentLevel } from '../game/engine';
import { GameState } from '../game/types';

// Reusable scratch vectors to avoid garbage collection
const _targetPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

/**
 * Maps a 1-based 9x9 grid row/col to 3D world (x, z) coordinates centered at (0, 0, 0).
 * Tile spacing is 1.25 units.
 */
function gridToWorldXZ(row: number, col: number): [number, number] {
  const tileSpacing = 1.25;
  const x = (col - 5) * tileSpacing;
  const z = (row - 5) * tileSpacing;
  return [x, z];
}

function getTileWorldXZ(tileIndex: number): [number, number] {
  const { row, col } = getTileGridPosition(tileIndex);
  return gridToWorldXZ(row, col);
}

/**
 * Builds a palm tree model for the Indonesian tropical archipelago landscape.
 */
function buildPalmTree(x: number, z: number, scale: number = 1): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0.15, z);
  tree.scale.setScalar(scale);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
    metalness: 0.1,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Curved segmented trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.7, 8), trunkMat);
  trunk.position.y = 0.35;
  trunk.rotation.z = 0.08;
  tree.add(trunk);

  // Palm fronds
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 4), leafMat);
    frond.position.set(Math.cos(angle) * 0.14, 0.68, Math.sin(angle) * 0.14);
    frond.rotation.x = Math.PI / 2.8;
    frond.rotation.y = angle;
    tree.add(frond);
  }

  return tree;
}

/**
 * Builds a composite 3D Character Avatar Pawn with Indonesian cultural motifs.
 */
function buildCompositeCharacterPawn(cardId: string, colorHex: string): THREE.Group {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.2,
  });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.4,
    roughness: 0.25,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.15,
  });

  // 1. Soft radial contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.28, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.015;
  group.add(shadowDisc);

  // 2. Heavy bevel pedestal base
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.1, 20), baseMat);
  pedestal.position.y = 0.05;
  group.add(pedestal);

  // 3. Gold rim ring
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 10, 20), goldTrimMat);
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = 0.11;
  group.add(goldRing);

  // 4. Stylized torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.35, 16), bodyMat);
  torso.position.y = 0.28;
  group.add(torso);

  // 5. Stylized Head / Mask
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), goldTrimMat);
  head.position.y = 0.52;
  group.add(head);

  // 6. Character-specific accessories
  if (cardId === 'garuda-aviator' || cardId === 'aviator') {
    // Golden Wings on back
    const wingGeo = new THREE.BoxGeometry(0.42, 0.12, 0.04);
    const wings = new THREE.Mesh(wingGeo, goldTrimMat);
    wings.position.set(0, 0.38, -0.12);
    group.add(wings);
  } else if (cardId === 'gatot-kaca' || cardId === 'warrior') {
    // Wayang Crown (Mahkota) & Golden Shoulder Armor
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), goldTrimMat);
    crown.position.y = 0.7;
    group.add(crown);
  } else if (cardId === 'dewi-sri' || cardId === 'maiden') {
    // Lotus Crown Finial
    const lotus = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), goldTrimMat);
    lotus.position.y = 0.68;
    group.add(lotus);
  } else {
    // Standard sovereign finial
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), goldTrimMat);
    finial.position.y = 0.68;
    group.add(finial);
  }

  return group;
}

/**
 * Builds Indonesian 3D Architecture:
 * - Level 2: Indonesian Traditional Joglo Pavilion (flared tiered roof, timber columns, warm courtyard lantern)
 * - Level 3: Modern Indonesian Landmark Skyscraper (geometric glass facade & illuminated gold spire)
 */
function buildCompositeDevelopmentMesh(
  level: 2 | 3,
  districtColorHex: string
): THREE.Group {
  const group = new THREE.Group();
  const themeColor = new THREE.Color(districtColorHex);

  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Rich teak wood
    roughness: 0.7,
    metalness: 0.1,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: themeColor,
    roughness: 0.35,
    metalness: 0.35,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.85,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.85,
  });

  if (level === 2) {
    // Indonesian Joglo Business Pavilion
    // 1. Raised stone terrace (umpak)
    const umpak = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), timberMat);
    umpak.position.y = 0.03;
    group.add(umpak);

    // 2. Four Teak Pillars (Soko Guru)
    const pillarGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8);
    const pOffsets = [-0.13, 0.13];
    pOffsets.forEach((px) => {
      pOffsets.forEach((pz) => {
        const pillar = new THREE.Mesh(pillarGeo, timberMat);
        pillar.position.set(px, 0.14, pz);
        group.add(pillar);
      });
    });

    // 3. Interior pavilion room
    const room = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), timberMat);
    room.position.y = 0.12;
    group.add(room);

    // 4. Lower flared eaves roof
    const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.12, 4), roofMat);
    lowerRoof.rotation.y = Math.PI / 4;
    lowerRoof.position.y = 0.27;
    group.add(lowerRoof);

    // 5. Upper steep Joglo crown (Brunjung)
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 4), roofMat);
    upperRoof.rotation.y = Math.PI / 4;
    upperRoof.position.y = 0.38;
    group.add(upperRoof);

    // 6. Gold ridge finial
    const finial = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), goldTrimMat);
    finial.position.y = 0.48;
    group.add(finial);
  } else {
    // Level 3: Indonesian Landmark Spire (Jakarta Skyscraper)
    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.44), timberMat);
    podium.position.y = 0.04;
    group.add(podium);

    const mainTower = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.34), glassMat);
    mainTower.position.y = 0.3;
    group.add(mainTower);

    // Art-Deco stepped crowns
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.26), roofMat);
    tier2.position.y = 0.62;
    group.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), goldTrimMat);
    tier3.position.y = 0.8;
    group.add(tier3);

    // Monas-style golden flame crest spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 8), goldTrimMat);
    spire.position.y = 1.02;
    group.add(spire);
  }

  return group;
}

/**
 * Builds the Center Indonesian National Landmark:
 * MONAS (Monumen Nasional Jakarta) with its iconic Cawan basin, tall marble obelisk,
 * and gilded golden flame (Lidah Api Kemerdekaan) surrounded by lush tropical palms!
 */
function buildCenterMonasMonument(): THREE.Group {
  const monument = new THREE.Group();

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.15,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Lush tropical park green
    roughness: 0.8,
    metalness: 0.05,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Reflecting pool blue
    roughness: 0.1,
    metalness: 0.8,
  });
  const goldFlameMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.95,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.2,
  });

  // 1. Medan Merdeka Plaza Park (High-res textured base with generated Monas Park aerial art)
  const monasTexture = loadGameTexture(TEXTURE_URLS.monasPlaza);
  const plazaGrassMat = new THREE.MeshStandardMaterial({
    map: monasTexture,
    roughness: 0.35,
    metalness: 0.1,
  });
  const plazaGrass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 6.8), plazaGrassMat);
  plazaGrass.position.y = 0.07;
  monument.add(plazaGrass);

  // 2. Reflecting pool around Monas
  const poolRim = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 3.6), stoneMat);
  poolRim.position.y = 0.15;
  monument.add(poolRim);

  const water = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.04, 3.3), waterMat);
  water.position.y = 0.18;
  monument.add(water);

  // 3. Monas Lower Pedestal (Square tiered foundation)
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 2.2), marbleMat);
  foundation.position.y = 0.27;
  monument.add(foundation);

  // 4. The Famous "Cawan" (Cup platform) of Monas
  const cawanBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.8, 0.22, 4), marbleMat);
  cawanBase.rotation.y = Math.PI / 4;
  cawanBase.position.y = 0.45;
  monument.add(cawanBase);

  // 5. Tall Sleek Obelisk Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2, 4), marbleMat);
  shaft.rotation.y = Math.PI / 4;
  shaft.position.y = 1.6;
  monument.add(shaft);

  // 6. Top Observation Deck Platform (Pelataran Puncak)
  const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.08, 4), marbleMat);
  topDeck.rotation.y = Math.PI / 4;
  topDeck.position.y = 2.74;
  monument.add(topDeck);

  // 7. Lidah Api Kemerdekaan (The 24K Gilded Gold Flame)
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 12), goldFlameMat);
  flame.position.y = 3.05;
  monument.add(flame);

  // 8. Flanking tropical palm trees at the four park corners
  const palmCoords: [number, number][] = [
    [-2.4, -2.4],
    [2.4, -2.4],
    [-2.4, 2.4],
    [2.4, 2.4],
    [-2.4, 0],
    [2.4, 0],
  ];
  palmCoords.forEach(([px, pz]) => {
    monument.add(buildPalmTree(px, pz, 0.9));
  });

  return monument;
}

interface CityTabletop3DProps {
  gameState: GameState;
  mode: 'title' | 'board';
  onSelectTile?: (tileIndex: number) => void;
  className?: string;
}

export const CityTabletop3D: React.FC<CityTabletop3DProps> = ({
  gameState,
  mode,
  onSelectTile,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<GameState>(gameState);
  const modeRef = useRef<'title' | 'board'>(mode);
  const onSelectTileRef = useRef(onSelectTile);

  stateRef.current = gameState;
  modeRef.current = mode;
  onSelectTileRef.current = onSelectTile;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software vs hardware WebGL
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(1, container.clientWidth || 640);
    const height = Math.max(1, container.clientHeight || 480);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061121); // Deep oceanic night
    scene.fog = new THREE.FogExp2(0x061121, 0.024);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 120);
    camera.position.set(0, 11.5, 12.5);
    camera.lookAt(0, 0.4, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting: Warm Indonesian Sun + Tropical Teal Fill
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x064e3b, 0.9);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(10, 18, 12);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      const d = 8.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 35;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.7);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minPolarAngle = Math.PI / 6;
    controls.minDistance = 6.5;
    controls.maxDistance = 22;
    controls.target.set(0, 0.4, 0);

    // Build Archipelago Table & 32 Tiles
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Tropical Archipelago Water Base with live sun caustics
    const seaTexture = loadGameTexture(TEXTURE_URLS.tropicalSea, { repeatX: 4, repeatY: 4 });
    const seaBase = new THREE.Mesh(
      new THREE.BoxGeometry(13.6, 0.35, 13.6),
      new THREE.MeshStandardMaterial({
        map: seaTexture,
        roughness: 0.15,
        metalness: 0.45,
      })
    );
    seaBase.position.y = -0.18;
    boardGroup.add(seaBase);

    // Royal Indonesian Batik Gold Rim
    const batikTexture = loadGameTexture(TEXTURE_URLS.batikGold, { repeatX: 6, repeatY: 1 });
    const boardRim = new THREE.Mesh(
      new THREE.BoxGeometry(12.45, 0.16, 12.45),
      new THREE.MeshStandardMaterial({
        map: batikTexture,
        roughness: 0.25,
        metalness: 0.8,
      })
    );
    boardRim.position.y = -0.12;
    boardGroup.add(boardRim);

    // Central Monumen Nasional (Monas)
    const centerMonas = buildCenterMonasMonument();
    boardGroup.add(centerMonas);

    // 32 Interactive Tiles with Glossy Marble Texture
    const marbleTexture = loadGameTexture(TEXTURE_URLS.marbleTile);
    const tileMeshes: THREE.Mesh[] = [];
    const tileBaseGeo = new THREE.BoxGeometry(1.16, 0.14, 1.16);
    const headerGeo = new THREE.BoxGeometry(1.12, 0.05, 0.28);

    const cornerMat = new THREE.MeshStandardMaterial({
      map: marbleTexture,
      color: 0xfffbeb,
      roughness: 0.15,
      metalness: 0.35,
    });
    const propertyTileMat = new THREE.MeshStandardMaterial({
      map: marbleTexture,
      roughness: 0.18,
      metalness: 0.25,
    });
    const specialTileMat = new THREE.MeshStandardMaterial({
      map: marbleTexture,
      color: 0xf0fdfa,
      roughness: 0.2,
      metalness: 0.25,
    });

    BOARD_TILES.forEach((tile) => {
      const [wx, wz] = getTileWorldXZ(tile.index);
      const isCorner =
        tile.index === 0 || tile.index === 8 || tile.index === 16 || tile.index === 24;

      const tileMesh = new THREE.Mesh(
        tileBaseGeo,
        isCorner
          ? cornerMat.clone()
          : tile.type === 'PROPERTY'
          ? propertyTileMat.clone()
          : specialTileMat.clone()
      );
      tileMesh.position.set(wx, 0.07, wz);
      tileMesh.userData = { tileIndex: tile.index };
      tileMeshes.push(tileMesh);
      boardGroup.add(tileMesh);

      // Top decal plate with district color, city name, and Indonesian Rupiah price
      const districtColor =
        tile.district && DISTRICTS[tile.district]
          ? DISTRICTS[tile.district].color
          : isCorner
          ? '#F59E0B'
          : '#0284C7';
      const priceText = tile.purchasePrice
        ? formatRupiah(tile.purchasePrice)
        : tile.type === 'START'
        ? 'BONUS GAJI'
        : tile.type === 'HOLDING'
        ? 'PULAU ASING'
        : tile.type === 'PLAZA'
        ? 'ALUN-ALUN'
        : tile.type === 'GO_TO_HOLDING'
        ? 'KEJAKSAAN'
        : tile.type === 'TRANSPORT'
        ? 'BANDARA'
        : tile.type === 'SERVICE'
        ? 'UTILITAS'
        : tile.type === 'FEE'
        ? 'RETRIBUSI'
        : 'KESEMPATAN';

      const decalTexture = createTileDecalTexture(tile.shortName, districtColor, priceText);
      const decalMat = new THREE.MeshStandardMaterial({
        map: decalTexture,
        roughness: 0.25,
        metalness: 0.1,
      });
      const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.06), decalMat);
      decalMesh.rotation.x = -Math.PI / 2;
      decalMesh.position.set(wx, 0.143, wz);
      boardGroup.add(decalMesh);

      if (tile.district && DISTRICTS[tile.district]) {
        const dColor = DISTRICTS[tile.district].color;
        const stripeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(dColor),
          roughness: 0.3,
          metalness: 0.5,
        });
        const stripe = new THREE.Mesh(headerGeo, stripeMat);
        stripe.position.set(wx, 0.16, wz);
        boardGroup.add(stripe);
      }
    });

    // Groups for Developments and Player Tokens
    const developmentsGroup = new THREE.Group();
    boardGroup.add(developmentsGroup);

    const tokensGroup = new THREE.Group();
    boardGroup.add(tokensGroup);
    const tokenMeshMap = new Map<string, THREE.Group>();

    let lastPropertySignature = '';
    function syncSceneFromGameState() {
      const st = stateRef.current;

      // 1. Rebuild 3D developments when builtLevel or ownership changes
      const sig = Object.values(st.properties)
        .map((p) => `${p.tileIndex}:${p.ownerId ?? ''}:${p.builtLevel}`)
        .join('|');

      if (sig !== lastPropertySignature) {
        lastPropertySignature = sig;
        while (developmentsGroup.children.length > 0) {
          developmentsGroup.remove(developmentsGroup.children[0]);
        }

        BOARD_TILES.forEach((tile) => {
          const prop = st.properties[tile.index];
          if (!prop || !prop.ownerId) return;
          const [wx, wz] = getTileWorldXZ(tile.index);

          // Owner color pin ring
          const owner = st.players.find((pl) => pl.id === prop.ownerId);
          if (owner) {
            const ownerRing = new THREE.Mesh(
              new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16),
              new THREE.MeshStandardMaterial({
                color: new THREE.Color(owner.color),
                metalness: 0.7,
                roughness: 0.2,
              })
            );
            ownerRing.position.set(wx - 0.32, 0.165, wz - 0.32);
            developmentsGroup.add(ownerRing);
          }

          const effLevel = getEffectiveDevelopmentLevel(st.properties, tile.index);
          if (effLevel >= 2 && tile.district) {
            const devModel = buildCompositeDevelopmentMesh(
              effLevel as 2 | 3,
              DISTRICTS[tile.district].color
            );
            devModel.position.set(wx, 0.15, wz);
            developmentsGroup.add(devModel);
          }
        });
      }

      // 2. Sync player tokens & hop-by-hop movement physics
      st.players.forEach((player, pIdx) => {
        let tokenObj = tokenMeshMap.get(player.id);
        if (!tokenObj) {
          tokenObj = buildCompositeCharacterPawn(player.cardId, player.color);
          const [initX, initZ] = getTileWorldXZ(player.position);
          tokenObj.position.set(initX, 0.14, initZ);
          tokensGroup.add(tokenObj);
          tokenMeshMap.set(player.id, tokenObj);
        }

        tokenObj.visible = !player.isBankrupt;
        if (player.isBankrupt) return;

        const [tx, tz] = getTileWorldXZ(player.position);
        const angle = (pIdx / Math.max(1, st.players.length)) * Math.PI * 2;
        const offsetR = 0.22;
        _targetPos.set(tx + Math.cos(angle) * offsetR, 0.14, tz + Math.sin(angle) * offsetR);

        // Calculate horizontal delta distance to target
        const dx = _targetPos.x - tokenObj.position.x;
        const dz = _targetPos.z - tokenObj.position.z;
        const dist = Math.hypot(dx, dz);

        // Smooth damping
        tokenObj.position.x = THREE.MathUtils.damp(tokenObj.position.x, _targetPos.x, 10, 0.035);
        tokenObj.position.z = THREE.MathUtils.damp(tokenObj.position.z, _targetPos.z, 10, 0.035);

        // Tactile avatar hopping bounce (Let's Get Rich style)
        if (dist > 0.08) {
          const hopHeight = Math.sin(Math.min(1, dist / 0.8) * Math.PI) * 0.45;
          tokenObj.position.y = 0.14 + hopHeight;
          // Squash and stretch
          tokenObj.scale.set(0.95, 1.1, 0.95);
        } else {
          tokenObj.position.y = THREE.MathUtils.damp(tokenObj.position.y, 0.14, 12, 0.035);
          tokenObj.scale.set(1, 1, 1);
        }
      });
    }

    // Raycaster for 3D Tile Clicking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      if (modeRef.current === 'title') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(tileMeshes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData?.tileIndex;
        if (typeof idx === 'number' && onSelectTileRef.current) {
          onSelectTileRef.current(idx);
        }
      }
    };
    renderer.domElement.addEventListener('click', handlePointerDown);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 85);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let orbitAngle = 0.55;
    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      syncSceneFromGameState();

      // Animate tropical ocean caustics shimmer
      seaTexture.offset.x = (now * 0.00003) % 1;
      seaTexture.offset.y = (now * 0.000015) % 1;

      if (modeRef.current === 'title') {
        orbitAngle += dt * 0.22;
        camera.position.x = Math.sin(orbitAngle) * 11.8 - 2.2;
        camera.position.z = Math.cos(orbitAngle) * 11.8 + 1.5;
        camera.position.y = 8.4 + Math.sin(orbitAngle * 0.7) * 0.6;
        _lookTarget.set(-2.2, 0.2, 0);
        camera.lookAt(_lookTarget);
      } else {
        // Camera smooth tracking of active player in Let's Get Rich mode
        const activePlayer = stateRef.current.players[stateRef.current.currentPlayerIndex];
        if (activePlayer && !activePlayer.isBankrupt) {
          const [ax, az] = getTileWorldXZ(activePlayer.position);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, ax * 0.4, 4, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, az * 0.4, 4, dt);
        }
        controls.update();
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, entry.contentRect.width);
        const h = Math.max(1, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        syncSceneFromGameState();
        renderer.render(scene, camera);
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handlePointerDown);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="city-tabletop-3d"
      className={`relative w-full h-full overflow-hidden ${className}`}
    />
  );
};
