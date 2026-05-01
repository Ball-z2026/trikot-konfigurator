import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────
interface TrikotViewer3DProps {
  frontTextureUrl?: string;
  backTextureUrl?: string;
  baseColor?: string;
  className?: string;
}

// ─── T-Shirt Shape als gewölbte Geometrie ────────────
// Erstellt eine PlaneGeometry mit T-Shirt-Silhouette über Alpha und leichter Wölbung
function createCurvedPlane(segments: number = 32): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(3, 3.5, segments, segments);
  const pos = geometry.attributes.position;

  // Leichte zylindrische Wölbung
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Wölbung: Mitte nach vorne, Ränder nach hinten
    const z = -Math.pow(x / 1.5, 2) * 0.3 + Math.sin((y + 1.75) / 3.5 * Math.PI) * 0.08;
    pos.setZ(i, z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

// ─── T-Shirt Silhouette als Shape für Clipping ───────
function createTShirtClipShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Skaliert auf die PlaneGeometry-Größe (3 x 3.5)
  const s = 1.0; // Skalierungsfaktor

  // T-Shirt-Silhouette (zentriert)
  shape.moveTo(-0.9 * s, -1.4 * s);
  shape.quadraticCurveTo(-0.85 * s, -0.5 * s, -0.9 * s, 0.2 * s);
  shape.lineTo(-1.4 * s, 0.5 * s);
  shape.lineTo(-1.4 * s, 0.85 * s);
  shape.lineTo(-0.85 * s, 0.65 * s);
  shape.lineTo(-0.65 * s, 1.05 * s);
  shape.quadraticCurveTo(-0.3 * s, 1.25 * s, 0, 1.05 * s);
  shape.quadraticCurveTo(0.3 * s, 1.25 * s, 0.65 * s, 1.05 * s);
  shape.lineTo(0.85 * s, 0.65 * s);
  shape.lineTo(1.4 * s, 0.85 * s);
  shape.lineTo(1.4 * s, 0.5 * s);
  shape.lineTo(0.9 * s, 0.2 * s);
  shape.quadraticCurveTo(0.85 * s, -0.5 * s, 0.9 * s, -1.4 * s);
  shape.lineTo(-0.9 * s, -1.4 * s);

  return shape;
}

// ─── T-Shirt Mesh mit Extrude-Geometrie ──────────────
function TShirtMesh({
  frontTextureUrl,
  baseColor,
}: {
  frontTextureUrl?: string;
  baseColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);

  // Erstelle extrudierte T-Shirt-Form
  const geometry = useMemo(() => {
    const shape = createTShirtClipShape();
    const extrudeSettings = {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 24,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    // Füge leichte Krümmung hinzu
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Zylindrische Krümmung
      const curveZ = z - Math.pow(x, 2) * 0.08;
      // Leichte Schulter-Wölbung
      const shoulderZ = curveZ + (y > 0.5 ? (y - 0.5) * 0.05 : 0);
      pos.setZ(i, shoulderZ);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Load texture
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
        tex.flipY = true;
        setFrontTexture(tex);
      },
      undefined,
      () => setFrontTexture(null)
    );
  }, [frontTextureUrl]);

  // Sanfte Rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const color = baseColor || "#e8eaed";

  return (
    <group ref={groupRef} scale={[1.3, 1.3, 1.3]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          map={frontTexture}
          roughness={0.75}
          metalness={0.0}
          side={THREE.DoubleSide}
          flatShading={false}
        />
      </mesh>
    </group>
  );
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
        camera={{ position: [0, 0.2, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={2.0} />
        <directionalLight position={[3, 4, 5]} intensity={1.0} />
        <directionalLight position={[-3, 2, -3]} intensity={0.5} />
        <pointLight position={[0, -1, 4]} intensity={0.4} />
        <Suspense fallback={null}>
          <TShirtMesh
            frontTextureUrl={frontTextureUrl}
            baseColor={baseColor}
          />
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
