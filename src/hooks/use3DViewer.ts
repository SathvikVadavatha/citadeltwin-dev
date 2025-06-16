import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useFEAAnalyses } from './useFEAAnalyses';

export const use3DViewer = (elementId?: string) => {
  const {
    analyses,
    analysesLoading,
    createAnalysis,
    runAnalysis,
    results
  } = useFEAAnalyses(elementId);

  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Scene
        const newScene = new THREE.Scene();
        newScene.background = new THREE.Color(0x404040); // Dark gray background
        setScene(newScene);

        // Camera
        const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        newCamera.position.set(0, 5, 10);
        setCamera(newCamera);

        // Renderer
        const newRenderer = new THREE.WebGLRenderer({ antialias: true });
        newRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(newRenderer.domElement);
        setRenderer(newRenderer);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        newScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 10, 5);
        newScene.add(directionalLight);

        // Grid Helper
        const gridHelper = new THREE.GridHelper(20, 20);
        newScene.add(gridHelper);

        // GLTF Loader
        const gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load('/models/structure.glb', (gltf) => {
          const loadedModel = gltf.scene;
          newScene.add(loadedModel);
          setModel(loadedModel);

          // Bounding box calculation
          const boundingBox = new THREE.Box3().setFromObject(loadedModel);
          const center = boundingBox.getCenter(new THREE.Vector3());
          loadedModel.position.sub(center);
          newCamera.lookAt(loadedModel.position);

          // Fit camera to object
          const size = boundingBox.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          const fov = newCamera.fov * (Math.PI / 180);
          let cameraDistance = maxDimension / (2 * Math.tan(fov / 2));
          cameraDistance *= 1.5; // Add some padding

          newCamera.position.copy(center);
          newCamera.position.z += cameraDistance;
          newCamera.lookAt(center);

          const animate = () => {
            requestAnimationFrame(animate);
            newRenderer.render(newScene, newCamera);
          };

          animate();
        }, undefined, (err) => {
          setError(`An error occurred while loading the model: ${err}`);
          setLoading(false);
          console.error(err);
        });

        // Animation loop
        const animate = () => {
          if (newRenderer && newScene && newCamera) {
            requestAnimationFrame(animate);
            newRenderer.render(newScene, newCamera);
          }
        };

        animate();

        // Handle window resize
        const handleResize = () => {
          if (newCamera && newRenderer) {
            newCamera.aspect = window.innerWidth / window.innerHeight;
            newCamera.updateProjectionMatrix();
            newRenderer.setSize(window.innerWidth, window.innerHeight);
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          document.body.removeChild(newRenderer.domElement);
        };
      } catch (err: any) {
        setError(`Failed to initialize 3D viewer: ${err}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return {
    scene,
    camera,
    renderer,
    model,
    loading,
    error,
    analyses,
    runAnalysis,
    results
  };
};
