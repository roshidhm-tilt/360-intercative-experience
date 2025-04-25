import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
  const mouse = useRef()

    // 👇 Call this to add a hotspot
    const addHotspot = (position, label) => {
      const spriteMap = new THREE.TextureLoader().load('/hotspot.png'); // Use your own icon here
      const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap, sizeAttenuation: false });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(20, 20, 1); // Adjust size
      sprite.userData.label = label;
  
      sceneRef.current?.add(sprite);
      hotspotRefs.current.push(sprite);
    };
  
    const onClick = (event) => {
      const bounds = rendererRef.current?.domElement.getBoundingClientRect();
      if (!bounds) return;
  
      mouse.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  
      raycaster.current.setFromCamera(mouse.current, !cameraRef.current);
      const intersects = raycaster.current.intersectObjects(hotspotRefs.current);
  
      if (intersects.length > 0) {
        const hotspot = intersects[0].object;
        alert(`Hotspot clicked: ${hotspot.userData.label}`);
      }
    };

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    cameraRef.current = camera;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // const texture = new THREE.TextureLoader().load('/shot-panoramic-composition-library (1).jpg');
    const texture = new THREE.TextureLoader().load('/53400175859_7a5bf9d9f0_o.jpg');
  
    // const texture = new THREE.TextureLoader().load('/2294472375_24a3b8ef46_3.jpg');

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;


    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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

    const onPointerUp = (event) => {
      if (!event.isPrimary) return;
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

    const animate = () => {
      requestAnimationFrame(animate);

      // if (!isUserInteracting.current) {
      //   lon.current += 0.1;
      // }

      lat.current = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - lat.current);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      const y = 500 * Math.cos(phi.current);
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };

    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('wheel', onMouseWheel);
    window.addEventListener('resize', onResize);

    animate();

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('wheel', onMouseWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
};

export default PanoramaViewer;
