/**
 * Shared GLTF / GLB loader with Draco support.
 *
 * Every Three.js path that loads a Mint-generated GLB must use this helper
 * instead of instantiating a bare GLTFLoader.  The singleton DRACOLoader
 * points at the Mint CDN decoder and is lazily initialised on first use.
 *
 * @see references/gltf-runtime-compatibility.md
 */

import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DRACO_CDN = 'https://cdn.mint.gg/runtime/draco/gltf/three-0.184.0/';

let _gltfLoader: GLTFLoader | null = null;
let _dracoLoader: DRACOLoader | null = null;

/**
 * Returns a shared GLTFLoader with Draco decoding configured.
 * The DRACOLoader is created once and reused across all loads.
 */
export function getGLTFLoader(decoderPath?: string): GLTFLoader {
  if (!_gltfLoader) {
    _dracoLoader = new DRACOLoader();
    _dracoLoader.setDecoderPath(decoderPath ?? DRACO_CDN);
    _dracoLoader.setDecoderConfig({ type: 'js' }); // Fallback for environments without WASM
    _dracoLoader.preload();

    _gltfLoader = new GLTFLoader();
    _gltfLoader.setDRACOLoader(_dracoLoader);
  }
  return _gltfLoader;
}

/**
 * Convenience: load a single GLB/GLTF model and return its scene.
 */
export function loadModel(url: string): Promise<GLTF> {
  const loader = getGLTFLoader();
  return new Promise<GLTF>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (err) => reject(err),
    );
  });
}

/**
 * Permanently dispose shared loaders.
 * Call only during full application teardown — not per-component unmount.
 */
export function disposeGLTFRuntime(): void {
  _dracoLoader?.dispose();
  _dracoLoader = null;
  _gltfLoader = null;
}
