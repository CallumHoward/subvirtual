"use strict";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { FpControls } from "./controls";
import { Sketch1 } from "./sketch1";

const initThreeCanvas = () => {
  let scene;
  let camera;
  let controls;
  let renderer;
  let clock = new THREE.Clock();
  const loader = new GLTFLoader();
  let gltfObjs = [];

  const sketch1 = Sketch1(500, 500);

  const loadGltf = (filePath) => {
    loader.load(filePath, (gltf) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      gltfObjs.push({ gltf, mixer });
      gltf.scene.scale.set(1, 1, 1);
      scene.add(gltf.scene);
    });
  };

  const resizeCanvasToDisplaySize = () => {
    const canvas = renderer.domElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  const initScene = () => {
    scene = new THREE.Scene();
    let pmremGenerator = new THREE.PMREMGenerator(renderer);

    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load("img/royal_esplanade_1k.hdr", (hdrEquirect) => {
        let hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(
          hdrEquirect
        );
        hdrEquirect.dispose();
        pmremGenerator.dispose();

        scene.background = hdrCubeRenderTarget.texture;
        scene.environment = hdrCubeRenderTarget.texture;
      });

    pmremGenerator.compileEquirectangularShader();
  };

  const addLights = () => {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1, 100);
    directionalLight.position.set(0, 5, 10);
    scene.add(directionalLight);
    directionalLight.castShadow = true;
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.height = 256;
    directionalLight.shadow.mapSize.width = 256;
    directionalLight.shadow.camera = new THREE.OrthographicCamera(
      -6,
      6,
      6,
      -6,
      8,
      20
    );
    // const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(cameraHelper);
  };

  const addCamera = () => {
    camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 0);
  };

  const addControls = () => {
    controls = FpControls(
      camera,
      document.body,
      document.getElementById("blocker")
    );
    scene.add(controls.getObject());
  };

  const addCube = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: sketch1.renderTarget.texture,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    mesh.position.z = -5;
    scene.add(mesh);
  };

  const initAndAttachCanvas = () => {
    const selfHtmlNode = document.getElementById("mainCanvas");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    selfHtmlNode.appendChild(renderer.domElement);
    renderer.setSize(selfHtmlNode.clientWidth, selfHtmlNode.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    window.addEventListener("resize", () => {
      resizeCanvasToDisplaySize();
    });
  };

  initAndAttachCanvas();
  initScene();
  addCamera();
  addControls();
  addLights();
  loadGltf("resources/gallery01.glb");
  addCube();
  resizeCanvasToDisplaySize();

  const animate = () => {
    requestAnimationFrame(animate);

    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    controls.update();

    renderer.setRenderTarget(sketch1.renderTarget);
    renderer.clear();
    renderer.render(sketch1.scene, sketch1.camera);

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
  };

  animate();
};

export default initThreeCanvas;
