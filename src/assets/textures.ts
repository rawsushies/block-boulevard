import * as THREE from 'three';

// Export generated texture image paths (bundled via Vite)
import monasPlazaImg from './images/board_monas_plaza_1793623599271.jpg';
import tropicalSeaImg from './images/tropical_sea_caustics_1793623629015.jpg';
import batikGoldImg from './images/batik_gold_pattern_1793623649494.jpg';
import marbleTileImg from './images/marble_game_tiles_1793623669283.jpg';

export const TEXTURE_URLS = {
  monasPlaza: monasPlazaImg,
  tropicalSea: tropicalSeaImg,
  batikGold: batikGoldImg,
  marbleTile: marbleTileImg,
};

// Texture Loader cache (singleton)
const textureLoader = new THREE.TextureLoader();
const cachedTextures: Record<string, THREE.Texture> = {};

export function loadGameTexture(
  url: string,
  options: { repeatX?: number; repeatY?: number; roughness?: boolean } = {}
): THREE.Texture {
  if (cachedTextures[url]) {
    return cachedTextures[url];
  }

  const texture = textureLoader.load(url);
  texture.colorSpace = options.roughness ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (options.repeatX || options.repeatY) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
  }

  cachedTextures[url] = texture;
  return texture;
}

/**
 * Creates a high-res procedural canvas texture for city landmark signs,
 * combining Indonesian district colors, gold foil seals, and city typography.
 */
export function createTileDecalTexture(
  name: string,
  districtColor: string,
  priceLabel: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background glossy porcelain
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#F8FAFC');
  grad.addColorStop(1, '#F1F5F9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Gold decorative border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, 480, 480);
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 460);

  // District header color bar
  ctx.fillStyle = districtColor;
  ctx.fillRect(30, 30, 452, 110);

  // Gold separator line
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(30, 140, 452, 6);

  // District banner text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6;
  ctx.fillText(name.slice(0, 16).toUpperCase(), 256, 85);
  ctx.shadowBlur = 0;

  // Center crest or seal
  ctx.beginPath();
  ctx.arc(256, 280, 70, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Price label footer
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 32px monospace';
  ctx.fillText(priceLabel, 256, 420);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
