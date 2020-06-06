import * as THREE from "three";

export const Sketch1 = (width, height) => {
  const scene = new THREE.Scene();
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
  });
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

  // Sketch
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: "red",
    wireframe: "true",
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -5;
  const ambientLight = new THREE.AmbientLight("hsl(0, 0%, 95%)");
  scene.add(ambientLight);
  scene.add(mesh);
  scene.add(camera);

  return { scene, renderTarget, camera };
};
