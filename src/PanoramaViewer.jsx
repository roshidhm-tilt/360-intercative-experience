import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import "./App.css"

const toScreenPosition = (obj, camera, renderer) => {
  const vector = obj.position.clone().project(camera);
  const widthHalf = 0.5 * renderer.domElement.clientWidth;
  const heightHalf = 0.5 * renderer.domElement.clientHeight;

  return {
    x: (vector.x * widthHalf) + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf
  };
};

const PanoramaViewer = () => {
  const containerRef = useRef(null);
  const isUserInteracting = useRef(false);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const lon = useRef(0);
  const lat = useRef(0);
  const phi = useRef(0);
  const theta = useRef(0);
  const cameraRef = useRef();
  const rendererRef = useRef();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef({ x: 0, y: 0 });
  const sceneRef = useRef();
  const hotspotRefs = useRef([]);

  const createTooltipTexture = (text) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    const width = ctx.measureText(text).width + 2;
    const height = 40;
  
    // canvas.width = width;
    // canvas.height = height;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 200, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 40, height / 1.5);
  
    return new THREE.CanvasTexture(canvas);
  };

  const createHotspotTexture = () => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
  
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fill();
  
    return new THREE.CanvasTexture(canvas);
  };

  const addHotspot = (position, label) => {
    const texture = createHotspotTexture();
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    const baseScale = 8;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.position.copy(position);
    sprite.userData.label = label;
    // sprite.userData.texture = texture;
    sprite.userData.baseScale = baseScale;
    sceneRef.current?.add(sprite);
    hotspotRefs.current.push(sprite);
  };

  const onClick = (event) => {
    const bounds = rendererRef.current?.domElement.getBoundingClientRect();
    if (!bounds) return;

    mouse.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const intersects = raycaster.current.intersectObjects(hotspotRefs.current);

    const tooltip = document.getElementById('tooltip');

    if (intersects.length > 0) {
      const hotspot = intersects[0].object;
      const label = hotspot.userData.label;

    // Create and add 3D Tooltip Sprite
    const texture = createTooltipTexture(label);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const tooltipSprite = new THREE.Sprite(spriteMaterial);
    tooltipSprite.scale.set(50, 50, 1);
    
    // Position the tooltip at the hotspot's position
    tooltipSprite.position.copy(hotspot.position);
    sceneRef.current?.add(tooltipSprite);

    // Optionally remove tooltip after 3 seconds
    setTimeout(() => {
      sceneRef.current?.remove(tooltipSprite);
    }, 3000);
  }
  };

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    cameraRef.current = camera;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const texture = new THREE.TextureLoader().load('/54457658213_e8d620a169_o.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 🔥 Add multiple hotspots
    addHotspot(new THREE.Vector3(100, 0, 0), 'Hotspot A');
    addHotspot(new THREE.Vector3(-100, 50, 100), 'Hotspot B');
    addHotspot(new THREE.Vector3(0, 50, -100), 'Hotspot C');
    addHotspot(new THREE.Vector3(150, 20, -50), 'Hotspot D');

    const onPointerDown = (event) => {
      if (!event.isPrimary) return;
      isUserInteracting.current = true;
      onPointerDownMouseX.current = event.clientX;
      onPointerDownMouseY.current = event.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (event) => {
      if (!event.isPrimary) return;
      lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
    };

    const onPointerUp = () => {
      isUserInteracting.current = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    const onMouseWheel = (event) => {
      const newFov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(newFov, 30, 85);
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      lat.current = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - lat.current);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      const y = 500 * Math.cos(phi.current);
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current);
      camera.lookAt(x, y, z);

      // Animate hotspot pulse
      time += 0.05;
      hotspotRefs.current.forEach((sprite) => {
        const scale = sprite.userData.baseScale + Math.sin(time * 2) * 2;
        sprite.scale.set(scale, scale, 1);
      });

      renderer.render(scene, camera);
    };

    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('click', onClick);
    document.addEventListener('wheel', onMouseWheel);
    window.addEventListener('resize', onResize);

    animate();

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('click', onClick);
      document.removeEventListener('wheel', onMouseWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }} />
       <div id="tooltip" style={{
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '6px',
        display: 'none',
        pointerEvents: 'none',
        transform: 'translate(-50%, -100%)',
        whiteSpace: 'nowrap'
      }} />
    </>
  );
};

export default PanoramaViewer;
