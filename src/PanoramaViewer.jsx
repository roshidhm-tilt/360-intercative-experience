

// PanoramaViewer.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { VRButton } from 'three/examples/jsm/webxr/VRButton';

const hotspots = [
  { id: 1, label: 'Hotspot 1', position: new THREE.Vector3(10, 0, -30) },
  { id: 2, label: 'Hotspot 2', position: new THREE.Vector3(-15, 5, -20) },
  { id: 3, label: 'Hotspot 3', position: new THREE.Vector3(5, -5, 25) },
];

const PanoramaViewer = () => {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0.1, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add VR button
    // document.body.appendChild(VRButton.createButton(renderer));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Load Panorama
    const loader = new THREE.TextureLoader();
    loader.load('/shot-panoramic-composition-living-room.jpg', (texture) => {
      const geometry = new THREE.SphereGeometry(50, 60, 40);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.scale.set(-1, 1, 1);
      scene.add(sphere);
    });

    // Add hotspots
    const hotspotMeshes = [];
    const hotspotGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const hotspotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    hotspots.forEach((spot) => {
      const mesh = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
      mesh.position.copy(spot.position);
      mesh.userData = spot;
      scene.add(mesh);
      hotspotMeshes.push(mesh);
    });

    // Hotspot click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      if (!container || !cameraRef.current) return;
      const bounds = container.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(hotspotMeshes);
      if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        setTooltip({ label: data.label, x: event.clientX, y: event.clientY });
      } else {
        setTooltip(null);
      }
    };

    container.addEventListener('click', onClick);

    const onWheel = (event) => {
        if (!cameraRef.current) return;
        event.preventDefault();
      
        const zoomFactor = 1.05;
        if (event.deltaY < 0) {
          // Scroll up => Zoom in
          cameraRef.current.fov /= zoomFactor;
        } else {
          // Scroll down => Zoom out
          cameraRef.current.fov *= zoomFactor;
        }
      
        // Clamp FOV to avoid distortion
        cameraRef.current.fov = THREE.MathUtils.clamp(cameraRef.current.fov, 30, 120);
        cameraRef.current.updateProjectionMatrix();
      };

      container.addEventListener('wheel', onWheel, { passive: false });


    // Animate
    const animate = () => {
      renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
      });
    };
    animate();

    // Resize
    const onResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

 

    return () => {
        container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  const handleZoom = (inOrOut) => {
    if (cameraRef.current) {
      const factor = inOrOut === 'in' ? 0.9 : 1.1;
      cameraRef.current.fov *= factor;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      {tooltip && (
        <div
        
          style={{
            position: 'fixed',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {tooltip.label}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 10 }}>
        <button
        className='px-[10px] py-[14px] bg-[#333] border-n border-[6px] hover:cursor-pointer '
          onClick={() => handleZoom('in')}
        //   style={zoomButtonStyle}
        >
          🔍 +
        </button>
        <button
        className='px-[10px] py-[14px] bg-[#333] border-n border-[6px] hover:cursor-pointer'
          onClick={() => handleZoom('out')}
        //   style={zoomButtonStyle}
        >
          🔍 −
        </button>
      </div>
    </>
  );
};

const zoomButtonStyle = {
  padding: '10px 14px',
  background: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '18px',
  cursor: 'pointer',
};

export default PanoramaViewer;
