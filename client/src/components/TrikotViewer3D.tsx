import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────
interface TrikotViewer3DProps {
  frontTextureUrl?: string;
  backTextureUrl?: string;
  baseColor?: string;
  className?: string;
}

// ─── T-Shirt Geometry Builder ────────────────────────
function createTShirtGeometry(): THREE.BufferGeometry {
  // Simple T-shirt shape using a flat plane with slight curvature
  const width = 2.4;
  const height = 3.0;
  const segW = 32;
  const segH = 40;

  const geometry = new THREE.PlaneGeometry(width, height, segW, segH);
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    // Add subtle curvature to simulate fabric drape
    const curveFactor = 0.15;
    const z = -Math.pow(x / (width / 2), 2) * curveFactor;

    // Slight vertical curve (belly area)
    const bellyFactor = 0.05;
    const bellyZ = Math.sin((y / height + 0.5) * Math.PI) * bellyFactor;

    pos.setZ(i, z + bellyZ);
  }

  geometry.computeVertexNormals();
  return geometry;
}

// ─── TShirt Mesh Component ───────────────────────────
function TShirtMesh({
  frontTextureUrl,
  backTextureUrl,
  baseColor,
}: {
  frontTextureUrl?: string;
  backTextureUrl?: string;
  baseColor?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const backMeshRef = useRef<THREE.Mesh>(null);
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [backTexture, setBackTexture] = useState<THREE.Texture | null>(null);

  const geometry = useMemo(() => createTShirtGeometry(), []);

  // Back geometry (flipped)
  const backGeometry = useMemo(() => {
    const geo = createTShirtGeometry();
    // Flip normals for back side
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, -pos.getZ(i));
    }
    // Flip UV x for correct back mapping
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, 1 - uv.getX(i));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Load front texture
  useEffect(() => {
    if (!frontTextureUrl) {
      setFrontTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(
      frontTextureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        setFrontTexture(tex);
      },
      undefined,
      () => setFrontTexture(null)
    );
  }, [frontTextureUrl]);

  // Load back texture
  useEffect(() => {
    if (!backTextureUrl) {
      setBackTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(
      backTextureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        setBackTexture(tex);
      },
      undefined,
      () => setBackTexture(null)
    );
  }, [backTextureUrl]);

  // Gentle rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
    if (backMeshRef.current) {
      backMeshRef.current.rotation.y = meshRef.current?.rotation.y || 0;
    }
  });

  const color = baseColor || "#ffffff";

  return (
    <group>
      {/* Front */}
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          map={frontTexture}
          side={THREE.FrontSide}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
      {/* Back */}
      <mesh ref={backMeshRef} geometry={backGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          map={backTexture}
          side={THREE.FrontSide}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}

// ─── Scene Setup ─────────────────────────────────────
function SceneSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// ─── Main Component ──────────────────────────────────
export function TrikotViewer3D({
  frontTextureUrl,
  backTextureUrl,
  baseColor,
  className,
}: TrikotViewer3DProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 300 }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <SceneSetup />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <TShirtMesh
            frontTextureUrl={frontTextureUrl}
            backTextureUrl={backTextureUrl}
            baseColor={baseColor}
          />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={7}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 3 / 4}
        />
      </Canvas>
    </div>
  );
}

export default TrikotViewer3D;
