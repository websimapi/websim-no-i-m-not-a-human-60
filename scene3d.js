
```javascript
import * as THREE from 'https://esm.sh/three@0.158.0';
import { PointerLockControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/PointerLockControls.js';

export class Scene3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isActive = false;
        this.raycaster = new THREE.Raycaster();
        this.objects = [];
        this.nippleManager = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async init() {
        const container = document.createElement('div');
        container.id = 'scene3d-container';
        container.style.cssText = `
            position: fixed;
            inset: 0;
            background: #000;
            display: none;
            z-index: 10003;
        `;
        document.body.appendChild(container);

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x2a3d2a, 20, 100);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x1a1a1a);
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x8fbc8f, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            transparent: true,
            opacity: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Red Barn
        this.createBarn();

        // Trees and environment
        this.createEnvironment();

        // Controls
        this.setupControls();

        // Mobile controls
        if (this.isMobile) {
            await this.setupMobileControls();
        }

        // Event listeners
        this.setupEventListeners();

        return container;
    }

    createBarn() {
        const barnGroup = new THREE.Group();

        // Main barn structure
        const barnGeometry = new THREE.BoxGeometry(8, 6, 12);
        const barnMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        const barn = new THREE.Mesh(barnGeometry, barnMaterial);
        barn.position.set(0, 3, -15);
        barn.castShadow = true;
        barn.receiveShadow = true;
        barnGroup.add(barn);

        // Roof
        const roofGeometry = new THREE.ConeGeometry(7, 4, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 7.5, -15);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        barnGroup.add(roof);

        // Barn doors
        const doorGeometry = new THREE.BoxGeometry(2.5, 4, 0.2);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(-0.7, 2, -9.1);
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(0.7, 2, -9.1);
        barnGroup.add(leftDoor);
        barnGroup.add(rightDoor);

        this.scene.add(barnGroup);
        this.objects.push(barn);
    }

    createEnvironment() {
        // Create scattered trees
        for (let i = 0; i < 15; i++) {
            this.createTree(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80 - 20
            );
        }

        // Create fence posts
        for (let i = -20; i <= 20; i += 4) {
            this.createFencePost(i, 0, 8);
        }
    }

    createTree(x, y, z) {
        const treeGroup = new THREE.Group();

        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Leaves
        const leavesGeometry = new THREE.SphereGeometry(2.5);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        treeGroup.position.set(x, y, z);
        this.scene.add(treeGroup);
        this.objects.push(trunk);
    }

    createFencePost(x, y, z) {
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, y + 1, z);
        post.castShadow = true;
        this.scene.add(post);
        this.objects.push(post);
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
        this.scene.add(this.controls.getObject());

        // Clamp vertical rotation
        this.controls.maxPolarAngle = Math.PI * 0.7;
        this.controls.minPolarAngle = Math.PI * 0.3;
    }

    async setupMobileControls() {
        try {
            const nipplejs = await import('https://esm.sh/nipplejs');
            
            const joystickContainer = document.createElement('div');
            joystickContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 100px;
                height: 100px;
                z-index: 10004;
            `;
            document.getElementById('scene3d-container').appendChild(joystickContainer);

            this.nippleManager = nipplejs.create({
                zone: joystickContainer,
                mode: 'static', 
                position: { left: '50px', top: '50px' }, 
                color: 'rgba(204, 204, 204, 0.5)'
            });

            this.nippleManager.on('move', (evt, data) => {
                const forward = data.vector.y;
                const turn = data.vector.x;
                
                this.moveForward = forward > 0.3;
                this.moveBackward = forward < -0.3;
                this.moveLeft = false;
                this.moveRight = false;

                // Handle turning
                if (Math.abs(turn) > 0.3) {
                    this.controls.getObject().rotation.y -= turn * 0.02;
                }
            });

            this.nippleManager.on('end', () => {
                this.moveForward = false;
                this.moveBackward = false;
                this.moveLeft = false;
                this.moveRight = false;
            });
        } catch (error) {
            console.warn('Failed to load mobile controls:', error);
        }
    }

    setupEventListeners() {
        const onKeyDown = (event) => {
            if (!this.isActive) return;
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            if (!this.isActive) return;
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Click to lock pointer on desktop
        if (!this.isMobile) {
            this.renderer.domElement.addEventListener('click', () => {
                if (!this.isActive) return;
                this.controls.lock();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    update() {
        if (!this.isActive) return;

        const delta = this.clock.getDelta();

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 25.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 25.0 * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        // Keep camera above ground
        if (this.controls.getObject().position.y < 1.7) {
            this.controls.getObject().position.y = 1.7;
        }
    }

    render() {
        if (!this.isActive) return;
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        const container = document.getElementById('scene3d-container');
        if (container) {
            container.style.display = 'block';
            this.isActive = true;
            
            const animate = () => {
                if (!this.isActive) return;
                requestAnimationFrame(animate);
                this.render();
            };
            animate();

            // Show instructions for desktop users
            if (!this.isMobile) {
                const instructions = document.createElement('div');
                instructions.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    color: #ccc;
                    font-family: 'Roboto', sans-serif;
                    font-size: 14px;
                    z-index: 10004;
                    background: rgba(0,0,0,0.7);
                    padding: 10px;
                    border-radius: 5px;
                `;
                instructions.innerHTML = 'Click to look around<br>WASD to move';
                container.appendChild(instructions);
                
                setTimeout(() => {
                    if (instructions.parentNode) {
                        instructions.remove();
                    }
                }, 5000);
            }
        }
    }

    stop() {
        this.isActive = false;
        const container = document.getElementById('scene3d-container');
        if (container) {
            container.style.display = 'none';
        }
        
        if (this.nippleManager) {
            this.nippleManager.destroy();
            this.nippleManager = null;
        }
    }

    cleanup() {
        this.stop();
        if (this.renderer) {
            this.renderer.dispose();
        }
        const container = document.getElementById('scene3d-container');
        if (container) {
            container.remove();
        }
    }
}