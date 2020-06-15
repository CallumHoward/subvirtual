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

  // let collidableMeshList = [];

  const sketch1 = Sketch1(500, 500);

  const loadGltf = (filePath) => {
    loader.load(filePath, (gltf) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      gltfObjs.push({ gltf, mixer });
      gltf.scene.scale.set(1, 1, 1);
      console.log("LOG gltf: ", gltf);
      const collisionMeshGroup = gltf.scene.children.find(
        (e) => e.name === "CollisionMesh"
      );
      collisionMeshGroup.visible = false;
      controls.addCollidable(collisionMeshGroup);
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1, 300);
    scene.add(ambientLight);
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
    scene.add(controls.getBoundingBox());
  };

  const addCube = () => {
    const geometry = new THREE.CubeGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: sketch1.renderTarget.texture,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    mesh.position.z = -5;
    scene.add(mesh);
    controls.addCollidable(mesh);
    // collidableMeshList.push(mesh);
  };

  const addMovingCube = () => {
    const movingCubeGeometry = new THREE.CubeGeometry(1.2, 1.2, 1.2, 2, 2, 2);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0,
      transparent: true,
    });
    const movingCube = new THREE.Mesh(movingCubeGeometry, wireMaterial);
    scene.add(movingCube);

    const moveDistance = 0.1;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

    // set up keyboard controls
    const onKeyDown = function (event) {
      switch (event.keyCode) {
        case 73: // w
          moveForward = true;
          break;
        case 74: // a
          moveLeft = true;
          break;
        case 75: // s
          moveBackward = true;
          break;
        case 76: // d
          moveRight = true;
          break;
      }
    };

    const onKeyUp = function (event) {
      switch (event.keyCode) {
        case 73: // i
          moveForward = false;
          break;
        case 74: // j
          moveLeft = false;
          break;
        case 75: // k
          moveBackward = false;
          break;
        case 76: // l
          moveRight = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    const update = () => {
      if (moveForward) {
        movingCube.position.z -= moveDistance;
      } else if (moveBackward) {
        movingCube.position.z += moveDistance;
      } else if (moveLeft) {
        movingCube.position.x -= moveDistance;
      } else if (moveRight) {
        movingCube.position.x += moveDistance;
      }

      // collision detection:
      //   determines if any of the rays from the cube's origin to each vertex
      //    intersects any face of a mesh in the array of target meshes
      //   for increased collision accuracy, add more vertices to the cube;
      //    for example, new THREE.CubeGeometry( 64, 64, 64, 8, 8, 8, wireMaterial )
      //   HOWEVER: when the origin of the ray is within the target mesh, collisions do not occur
      var originPoint = movingCube.position.clone();

      for (
        let vertexIndex = 0;
        vertexIndex < movingCube.geometry.vertices.length;
        vertexIndex++
      ) {
        let localVertex = movingCube.geometry.vertices[vertexIndex].clone();
        let globalVertex = localVertex.applyMatrix4(movingCube.matrix);
        let directionVector = globalVertex.sub(movingCube.position);

        let ray = new THREE.Raycaster(
          originPoint,
          directionVector.clone().normalize()
        );
        let collisionResults = ray.intersectObjects(collidableMeshList);
        if (
          collisionResults.length > 0 &&
          collisionResults[0].distance < directionVector.length()
        ) {
          console.log("collision");
          if (moveForward) {
            movingCube.position.z += moveDistance * 2;
          } else if (moveBackward) {
            movingCube.position.z -= moveDistance * 2;
          } else if (moveLeft) {
            movingCube.position.x += moveDistance * 2;
          } else if (moveRight) {
            movingCube.position.x -= moveDistance * 2;
          }
          break;
        }
      }
    };

    return { update };
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
  loadGltf("resources/gallery52.glb");
  addCube();
  // const movingCube = addMovingCube();
  resizeCanvasToDisplaySize();

  const animate = () => {
    requestAnimationFrame(animate);

    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    controls.update();
    // movingCube.update();

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
