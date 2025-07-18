import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const Game = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const [gameState, setGameState] = useState({
    resources: {
      wood: 0,
      food: 0,
      workers: 1
    },
    buildings: [],
    selectedBuilding: null
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera setup (isometric view)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some basic 3D shapes as placeholders
    addBasicShapes(scene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const addBasicShapes = (scene) => {
    // Create simple 3D shapes as placeholders for buildings
    
    // Worker Station (Box)
    const workerGeometry = new THREE.BoxGeometry(2, 1, 2);
    const workerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const workerBuilding = new THREE.Mesh(workerGeometry, workerMaterial);
    workerBuilding.position.set(-3, 0.5, -3);
    workerBuilding.castShadow = true;
    scene.add(workerBuilding);

    // Lumberjack Area (Cylinder)
    const lumberGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const lumberMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const lumberBuilding = new THREE.Mesh(lumberGeometry, lumberMaterial);
    lumberBuilding.position.set(3, 1.5, -3);
    lumberBuilding.castShadow = true;
    scene.add(lumberBuilding);

    // Campfire (Cone + Cylinder)
    const campfireBaseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
    const campfireBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const campfireBase = new THREE.Mesh(campfireBaseGeometry, campfireBaseMaterial);
    campfireBase.position.set(0, 0.1, 0);
    scene.add(campfireBase);

    const campfireGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const campfireMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
    const campfire = new THREE.Mesh(campfireGeometry, campfireMaterial);
    campfire.position.set(0, 0.7, 0);
    campfire.castShadow = true;
    scene.add(campfire);

    // Trees (Cones on Cylinders)
    for (let i = 0; i < 5; i++) {
      const treeX = (Math.random() - 0.5) * 15;
      const treeZ = (Math.random() - 0.5) * 15;
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(treeX, 0.5, treeZ);
      trunk.castShadow = true;
      scene.add(trunk);

      // Tree leaves
      const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
      const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.set(treeX, 2, treeZ);
      leaves.castShadow = true;
      scene.add(leaves);
    }

    // Simple character (Sphere + Cylinder)
    const characterBodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    const characterBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const characterBody = new THREE.Mesh(characterBodyGeometry, characterBodyMaterial);
    characterBody.position.set(-1, 0.5, -1);
    characterBody.castShadow = true;
    scene.add(characterBody);

    const characterHeadGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const characterHeadMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const characterHead = new THREE.Mesh(characterHeadGeometry, characterHeadMaterial);
    characterHead.position.set(-1, 1.3, -1);
    characterHead.castShadow = true;
    scene.add(characterHead);
  };

  const handleBuildingClick = (buildingType) => {
    if (gameState.resources.wood >= 5) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          wood: prev.resources.wood - 5
        },
        buildings: [...prev.buildings, { type: buildingType, id: Date.now() }]
      }));
    }
  };

  const handleResourceGather = (resourceType) => {
    setGameState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceType]: prev.resources[resourceType] + 1
      }
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game UI */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3>Whiteout Survival</h3>
        <div>Wood: {gameState.resources.wood}</div>
        <div>Food: {gameState.resources.food}</div>
        <div>Workers: {gameState.resources.workers}</div>
      </div>

      {/* Building Controls */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <button 
          onClick={() => handleBuildingClick('worker')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: gameState.resources.wood >= 5 ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: gameState.resources.wood >= 5 ? 'pointer' : 'not-allowed'
          }}
        >
          Build Worker Station (5 Wood)
        </button>
        <button 
          onClick={() => handleResourceGather('wood')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Gather Wood
        </button>
        <button 
          onClick={() => handleResourceGather('food')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#228B22',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Gather Food
        </button>
      </div>

      {/* Game Instructions */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '200px'
      }}>
        <h4>Instructions:</h4>
        <p>• Click Gather Wood/Food to collect resources</p>
        <p>• Build stations with wood</p>
        <p>• Manage your workers to survive</p>
      </div>
    </div>
  );
};

export default Game;