import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const Game = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState({
    resources: { wood: 0, meat: 0, money: 100, ammo: 10 },
    buildings: [],
    health: 100,
    followers: [],
    inventory: { axe: true, gun: true },
    level: 1,
    experience: 0
  });
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const playerRef = useRef(null);
  const keysRef = useRef({});
  const bearsRef = useRef([]);
  const treesRef = useRef([]);
  const followersRef = useRef([]);
  const buildingsRef = useRef([]);
  const uiUpdateRef = useRef(null);

  // Game state
  const playerStateRef = useRef({
    position: { x: 0, z: 0 },
    rotation: 0,
    isMoving: false,
    isAttacking: false,
    lastAttack: 0,
    isBeingAttacked: false,
    invulnerable: false
  });

  const gameStateRef = useRef({
    lastBearSpawn: 0,
    lastFollowerSpawn: 0,
    difficulty: 1
  });

  useEffect(() => {
    initializeGame();
    setupKeyboardControls();
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const initializeGame = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
    sceneRef.current = scene;

    // Camera setup (third person view)
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup - full screen
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(30, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5D2D });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create player
    createPlayer();
    
    // Create world objects
    createTrees();
    createBears();
    createBuildings();
    createNPCs();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Start game loop
    gameLoop();
  };

  const createPlayer = () => {
    const playerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0066CC });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    playerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.1;
    head.castShadow = true;
    playerGroup.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.3, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.3, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Weapon (gun)
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.6, 1.3, 0.3);
    gun.rotation.y = Math.PI / 2;
    playerGroup.add(gun);

    // Backpack
    const backpackGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const backpackMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 1.2, -0.5);
    backpack.castShadow = true;
    playerGroup.add(backpack);

    playerGroup.position.set(0, 0, 0);
    playerGroup.userData = { type: 'player', health: 100 };
    sceneRef.current.add(playerGroup);
    playerRef.current = playerGroup;
  };

  const createTrees = () => {
    const treePositions = [];
    for (let i = 0; i < 25; i++) {
      treePositions.push({
        x: (Math.random() - 0.5) * 180,
        z: (Math.random() - 0.5) * 180
      });
    }

    treePositions.forEach((pos, index) => {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Leaves
      const leavesGeometry = new THREE.ConeGeometry(2.5, 5, 8);
      const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 6;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      treeGroup.position.set(pos.x, 0, pos.z);
      treeGroup.userData = { type: 'tree', health: 100, id: index, maxHealth: 100 };
      sceneRef.current.add(treeGroup);
      treesRef.current.push(treeGroup);
    });
  };

  const createBears = () => {
    const bearPositions = [];
    for (let i = 0; i < 8; i++) {
      bearPositions.push({
        x: (Math.random() - 0.5) * 160,
        z: (Math.random() - 0.5) * 160
      });
    }

    bearPositions.forEach((pos, index) => {
      const bearGroup = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      bearGroup.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      bearGroup.add(head);

      // Eyes (red for aggressive)
      const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.2, 1.9, 0.5);
      bearGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.2, 1.9, 0.5);
      bearGroup.add(rightEye);

      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      
      const positions = [[-0.5, 0.4, 0.4], [0.5, 0.4, 0.4], [-0.5, 0.4, -0.4], [0.5, 0.4, -0.4]];
      positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        bearGroup.add(leg);
      });

      bearGroup.position.set(pos.x, 0, pos.z);
      bearGroup.userData = { 
        type: 'bear', 
        health: 200, 
        maxHealth: 200,
        id: index,
        aiState: 'wander',
        lastAI: Date.now(),
        lastAttack: 0,
        targetPosition: { x: pos.x, z: pos.z },
        speed: 0.1,
        attackRange: 3,
        viewRange: 15,
        damage: 20
      };
      sceneRef.current.add(bearGroup);
      bearsRef.current.push(bearGroup);
    });
  };

  const createBuildings = () => {
    const buildingConfigs = [
      { pos: { x: -15, z: -15 }, type: 'butcher', color: 0x8B4513, sign: 'BUTCHER' },
      { pos: { x: 15, z: -15 }, type: 'gunshop', color: 0x696969, sign: 'GUNS' },
      { pos: { x: -15, z: 15 }, type: 'lumber', color: 0x8B4513, sign: 'LUMBER' },
      { pos: { x: 15, z: 15 }, type: 'recruiter', color: 0x4169E1, sign: 'RECRUIT' },
      { pos: { x: 0, z: -25 }, type: 'shop', color: 0x8B4513, sign: 'SHOP' }
    ];

    buildingConfigs.forEach(config => {
      const buildingGroup = new THREE.Group();
      
      // Building
      const buildingGeometry = new THREE.BoxGeometry(4, 3, 4);
      const buildingMaterial = new THREE.MeshLambertMaterial({ color: config.color });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.y = 1.5;
      building.castShadow = true;
      buildingGroup.add(building);

      // Roof
      const roofGeometry = new THREE.ConeGeometry(3.5, 1.5, 4);
      const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 3.75;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      buildingGroup.add(roof);

      // Sign
      const signGeometry = new THREE.PlaneGeometry(2, 1);
      const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(0, 2.5, 2.1);
      buildingGroup.add(sign);

      buildingGroup.position.set(config.pos.x, 0, config.pos.z);
      buildingGroup.userData = { type: config.type, signText: config.sign };
      sceneRef.current.add(buildingGroup);
      buildingsRef.current.push(buildingGroup);
    });
  };

  const createNPCs = () => {
    // Create some wandering NPCs that can be recruited
    const npcPositions = [
      { x: -30, z: -30 }, { x: 30, z: -30 }, { x: -30, z: 30 }, { x: 30, z: 30 }
    ];

    npcPositions.forEach((pos, index) => {
      const npcGroup = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00CC66 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      npcGroup.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.5;
      head.castShadow = true;
      npcGroup.add(head);

      npcGroup.position.set(pos.x, 0, pos.z);
      npcGroup.userData = { 
        type: 'npc', 
        health: 100,
        id: index,
        aiState: 'wander',
        lastAI: Date.now(),
        targetPosition: { x: pos.x, z: pos.z },
        recruited: false
      };
      sceneRef.current.add(npcGroup);
    });
  };

  const createFollower = (position) => {
    const followerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    followerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    followerGroup.add(head);

    // Weapon
    const weaponGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.4, 1.2, 0.2);
    followerGroup.add(weapon);

    followerGroup.position.set(position.x, 0, position.z);
    followerGroup.userData = { 
      type: 'follower', 
      health: 80,
      id: Date.now(),
      aiState: 'follow',
      lastAI: Date.now(),
      targetPosition: position,
      followDistance: 3 + Math.random() * 2,
      lastAttack: 0
    };
    sceneRef.current.add(followerGroup);
    followersRef.current.push(followerGroup);
    
    return followerGroup;
  };

  const setupKeyboardControls = () => {
    const handleKeyDown = (event) => {
      keysRef.current[event.key.toLowerCase()] = true;
      
      if (event.key.toLowerCase() === ' ') {
        event.preventDefault();
        handleAttack();
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const handleMovement = (direction) => {
    if (!playerRef.current) return;

    const moveSpeed = 0.2;
    const currentTime = Date.now();
    
    switch (direction) {
      case 'up':
        playerStateRef.current.position.z -= moveSpeed;
        break;
      case 'down':
        playerStateRef.current.position.z += moveSpeed;
        break;
      case 'left':
        playerStateRef.current.position.x -= moveSpeed;
        break;
      case 'right':
        playerStateRef.current.position.x += moveSpeed;
        break;
    }

    playerStateRef.current.isMoving = true;
    setTimeout(() => {
      playerStateRef.current.isMoving = false;
    }, 100);
  };

  const updatePlayer = () => {
    if (!playerRef.current) return;

    const moveSpeed = 0.15;
    const keys = keysRef.current;
    let moved = false;

    // Keyboard movement
    if (keys['w'] || keys['arrowup']) {
      playerStateRef.current.position.z -= moveSpeed;
      moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      playerStateRef.current.position.z += moveSpeed;
      moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
      playerStateRef.current.position.x -= moveSpeed;
      moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
      playerStateRef.current.position.x += moveSpeed;
      moved = true;
    }

    // Update player position
    playerRef.current.position.x = playerStateRef.current.position.x;
    playerRef.current.position.z = playerStateRef.current.position.z;

    // Update camera to follow player
    if (cameraRef.current) {
      cameraRef.current.position.x = playerStateRef.current.position.x;
      cameraRef.current.position.z = playerStateRef.current.position.z + 10;
      cameraRef.current.lookAt(playerStateRef.current.position.x, 0, playerStateRef.current.position.z);
    }

    playerStateRef.current.isMoving = moved;
  };

  const updateBears = () => {
    const currentTime = Date.now();
    
    bearsRef.current.forEach(bear => {
      if (!bear.userData) return;

      const bearData = bear.userData;
      const playerPos = playerStateRef.current.position;
      const bearPos = bear.position;
      
      // Distance to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(playerPos.x - bearPos.x, 2) + 
        Math.pow(playerPos.z - bearPos.z, 2)
      );

      // AI behavior
      if (currentTime - bearData.lastAI > 50) {
        if (distanceToPlayer < bearData.viewRange) {
          // Chase player aggressively
          bearData.aiState = 'chase';
          const direction = {
            x: (playerPos.x - bearPos.x) / distanceToPlayer,
            z: (playerPos.z - bearPos.z) / distanceToPlayer
          };
          
          bear.position.x += direction.x * bearData.speed;
          bear.position.z += direction.z * bearData.speed;
          
          // Look at player
          bear.lookAt(playerPos.x, bear.position.y, playerPos.z);
          
          // Attack if close enough
          if (distanceToPlayer < bearData.attackRange && currentTime - bearData.lastAttack > 1000) {
            attackPlayer(bearData.damage);
            bearData.lastAttack = currentTime;
            
            // Visual attack effect
            bear.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => {
              bear.scale.set(1, 1, 1);
            }, 200);
          }
          
        } else if (bearData.aiState === 'wander') {
          // Random movement
          if (Math.random() < 0.03) {
            bearData.targetPosition = {
              x: bearPos.x + (Math.random() - 0.5) * 20,
              z: bearPos.z + (Math.random() - 0.5) * 20
            };
          }
          
          // Move towards target
          const targetDistance = Math.sqrt(
            Math.pow(bearData.targetPosition.x - bearPos.x, 2) + 
            Math.pow(bearData.targetPosition.z - bearPos.z, 2)
          );
          
          if (targetDistance > 1) {
            const direction = {
              x: (bearData.targetPosition.x - bearPos.x) / targetDistance,
              z: (bearData.targetPosition.z - bearPos.z) / targetDistance
            };
            
            bear.position.x += direction.x * bearData.speed * 0.5;
            bear.position.z += direction.z * bearData.speed * 0.5;
          }
        }
        
        bearData.lastAI = currentTime;
      }
    });
  };

  const updateFollowers = () => {
    const currentTime = Date.now();
    const playerPos = playerStateRef.current.position;
    
    followersRef.current.forEach(follower => {
      if (!follower.userData) return;

      const followerData = follower.userData;
      const followerPos = follower.position;
      
      // Distance to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(playerPos.x - followerPos.x, 2) + 
        Math.pow(playerPos.z - followerPos.z, 2)
      );

      // Follow player
      if (currentTime - followerData.lastAI > 100) {
        if (distanceToPlayer > followerData.followDistance) {
          const direction = {
            x: (playerPos.x - followerPos.x) / distanceToPlayer,
            z: (playerPos.z - followerPos.z) / distanceToPlayer
          };
          
          follower.position.x += direction.x * 0.08;
          follower.position.z += direction.z * 0.08;
          
          // Look at player
          follower.lookAt(playerPos.x, follower.position.y, playerPos.z);
        }
        
        // Attack nearby bears
        bearsRef.current.forEach(bear => {
          const bearPos = bear.position;
          const distanceToBear = Math.sqrt(
            Math.pow(bearPos.x - followerPos.x, 2) + 
            Math.pow(bearPos.z - followerPos.z, 2)
          );
          
          if (distanceToBear < 5 && currentTime - followerData.lastAttack > 1500) {
            // Follower attacks bear
            bear.userData.health -= 30;
            followerData.lastAttack = currentTime;
            
            // Visual effect
            follower.scale.set(1.1, 1.1, 1.1);
            setTimeout(() => {
              follower.scale.set(1, 1, 1);
            }, 150);
          }
        });
        
        followerData.lastAI = currentTime;
      }
    });
  };

  const attackPlayer = (damage) => {
    if (playerStateRef.current.invulnerable) return;
    
    setGameState(prev => ({
      ...prev,
      health: Math.max(0, prev.health - damage)
    }));
    
    // Make player invulnerable for 1 second
    playerStateRef.current.invulnerable = true;
    
    // Visual damage effect
    if (playerRef.current) {
      playerRef.current.material = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      setTimeout(() => {
        playerRef.current.material = new THREE.MeshLambertMaterial({ color: 0x0066CC });
        playerStateRef.current.invulnerable = false;
      }, 1000);
    }
  };

  const handleAttack = () => {
    const currentTime = Date.now();
    if (currentTime - playerStateRef.current.lastAttack < 500) return;
    
    playerStateRef.current.lastAttack = currentTime;
    const playerPos = playerStateRef.current.position;
    const attackRange = 4;

    // Attack bears
    bearsRef.current.forEach(bear => {
      if (!bear.userData) return;

      const bearPos = bear.position;
      const distance = Math.sqrt(
        Math.pow(playerPos.x - bearPos.x, 2) + 
        Math.pow(playerPos.z - bearPos.z, 2)
      );

      if (distance < attackRange) {
        bear.userData.health -= gameState.inventory.gun ? 50 : 25;
        
        // Visual hit effect
        bear.scale.set(0.8, 0.8, 0.8);
        setTimeout(() => {
          bear.scale.set(1, 1, 1);
        }, 100);
        
        if (bear.userData.health <= 0) {
          // Bear killed
          sceneRef.current.remove(bear);
          bearsRef.current = bearsRef.current.filter(b => b !== bear);
          
          setGameState(prev => ({
            ...prev,
            resources: {
              ...prev.resources,
              meat: prev.resources.meat + 2
            },
            experience: prev.experience + 10
          }));
        }
      }
    });

    // Attack trees
    treesRef.current.forEach(tree => {
      if (!tree.userData) return;

      const treePos = tree.position;
      const distance = Math.sqrt(
        Math.pow(playerPos.x - treePos.x, 2) + 
        Math.pow(playerPos.z - treePos.z, 2)
      );

      if (distance < attackRange) {
        tree.userData.health -= 40;
        
        // Visual damage effect
        const damagePercent = tree.userData.health / tree.userData.maxHealth;
        tree.scale.set(damagePercent, damagePercent, damagePercent);
        
        if (tree.userData.health <= 0) {
          // Tree cut down
          sceneRef.current.remove(tree);
          treesRef.current = treesRef.current.filter(t => t !== tree);
          
          setGameState(prev => ({
            ...prev,
            resources: {
              ...prev.resources,
              wood: prev.resources.wood + 3
            },
            experience: prev.experience + 5
          }));
        }
      }
    });
  };

  const handleBuildingInteraction = (buildingType) => {
    const playerPos = playerStateRef.current.position;
    const building = buildingsRef.current.find(b => b.userData.type === buildingType);
    
    if (!building) return;
    
    const buildingPos = building.position;
    const distance = Math.sqrt(
      Math.pow(playerPos.x - buildingPos.x, 2) + 
      Math.pow(playerPos.z - buildingPos.z, 2)
    );

    if (distance < 8) {
      switch (buildingType) {
        case 'butcher':
          if (gameState.resources.meat > 0) {
            setGameState(prev => ({
              ...prev,
              resources: {
                ...prev.resources,
                meat: prev.resources.meat - 1,
                money: prev.resources.money + 15
              }
            }));
          }
          break;
        case 'gunshop':
          if (gameState.resources.money >= 30) {
            setGameState(prev => ({
              ...prev,
              resources: {
                ...prev.resources,
                money: prev.resources.money - 30,
                ammo: prev.resources.ammo + 20
              }
            }));
          }
          break;
        case 'recruiter':
          if (gameState.resources.money >= 50) {
            setGameState(prev => ({
              ...prev,
              resources: {
                ...prev.resources,
                money: prev.resources.money - 50
              },
              followers: [...prev.followers, { id: Date.now() }]
            }));
            
            // Create new follower
            const followerPos = {
              x: playerPos.x + (Math.random() - 0.5) * 4,
              z: playerPos.z + (Math.random() - 0.5) * 4
            };
            createFollower(followerPos);
          }
          break;
        case 'lumber':
          if (gameState.resources.wood >= 5) {
            setGameState(prev => ({
              ...prev,
              resources: {
                ...prev.resources,
                wood: prev.resources.wood - 5,
                money: prev.resources.money + 25
              }
            }));
          }
          break;
      }
    }
  };

  const gameLoop = () => {
    updatePlayer();
    updateBears();
    updateFollowers();
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    animationIdRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game UI */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#FF6B6B' }}>🎯 Live Action Survival</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>🪵 Wood: {gameState.resources.wood}</div>
          <div>🥩 Meat: {gameState.resources.meat}</div>
          <div>💰 Money: ${gameState.resources.money}</div>
          <div>🔫 Ammo: {gameState.resources.ammo}</div>
          <div>❤️ Health: {gameState.health}/100</div>
          <div>👥 Followers: {gameState.followers.length}</div>
          <div>⭐ XP: {gameState.experience}</div>
        </div>
      </div>

      {/* Movement Controls */}
      <div style={{
        position: 'absolute',
        bottom: 120,
        left: 20,
        zIndex: 1000
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '5px' }}>
          <div></div>
          <button
            onMouseDown={() => handleMovement('up')}
            style={{
              width: '60px',
              height: '60px',
              fontSize: '20px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              border: '2px solid #00FF00',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ↑
          </button>
          <div></div>
          <button
            onMouseDown={() => handleMovement('left')}
            style={{
              width: '60px',
              height: '60px',
              fontSize: '20px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              border: '2px solid #00FF00',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <button
            onMouseDown={handleAttack}
            style={{
              width: '60px',
              height: '60px',
              fontSize: '16px',
              backgroundColor: 'rgba(255,0,0,0.8)',
              color: 'white',
              border: '2px solid #FF0000',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ⚔️
          </button>
          <button
            onMouseDown={() => handleMovement('right')}
            style={{
              width: '60px',
              height: '60px',
              fontSize: '20px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              border: '2px solid #00FF00',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            →
          </button>
          <div></div>
          <button
            onMouseDown={() => handleMovement('down')}
            style={{
              width: '60px',
              height: '60px',
              fontSize: '20px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              border: '2px solid #00FF00',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* Building Interactions */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🏪 Buildings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button
            onClick={() => handleBuildingInteraction('butcher')}
            style={{
              padding: '8px 12px',
              backgroundColor: gameState.resources.meat > 0 ? '#8B4513' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: gameState.resources.meat > 0 ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={gameState.resources.meat === 0}
          >
            🥩 Sell Meat ($15)
          </button>
          <button
            onClick={() => handleBuildingInteraction('gunshop')}
            style={{
              padding: '8px 12px',
              backgroundColor: gameState.resources.money >= 30 ? '#696969' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: gameState.resources.money >= 30 ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={gameState.resources.money < 30}
          >
            🔫 Buy Ammo ($30)
          </button>
          <button
            onClick={() => handleBuildingInteraction('recruiter')}
            style={{
              padding: '8px 12px',
              backgroundColor: gameState.resources.money >= 50 ? '#4169E1' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: gameState.resources.money >= 50 ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={gameState.resources.money < 50}
          >
            👥 Recruit ($50)
          </button>
          <button
            onClick={() => handleBuildingInteraction('lumber')}
            style={{
              padding: '8px 12px',
              backgroundColor: gameState.resources.wood >= 5 ? '#8B4513' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: gameState.resources.wood >= 5 ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={gameState.resources.wood < 5}
          >
            🪵 Sell Wood ($25)
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        zIndex: 1000,
        maxWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00FF00' }}>🎮 Live Action Controls</h3>
        <div>🔄 WASD/Buttons: Move player</div>
        <div>⚔️ SPACE/Red Button: Attack</div>
        <div>🎯 Get close to buildings to use them</div>
        <div>🐻 <span style={{ color: '#FF0000' }}>DANGER: Bears attack you!</span></div>
        <div>👥 Recruit followers to help fight</div>
        <div>💰 Manage resources and survive</div>
      </div>

      {/* Health Warning */}
      {gameState.health < 30 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          zIndex: 1000,
          animation: 'blink 1s infinite'
        }}>
          ⚠️ LOW HEALTH! FIND SAFETY! ⚠️
        </div>
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default Game;