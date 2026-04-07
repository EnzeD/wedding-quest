import * as THREE from "three";

export type PrefabRoofKind = "gable-z" | "flat";

export interface PrefabRoofSpec {
  kind: PrefabRoofKind;
  x: number;
  y: number;
  z: number;
  wx: number;
  dz: number;
}

const ROOF_RED = 0xc93f3f;
const ROOF_TRIM = 0x9c6c43;
const GABLE_FILL = 0x5d3a29;
const ROOF_BASE_Y = 0.04;

function material(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 });
}

function createSlope(width: number, slopeDepth: number, thickness: number, angle: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, slopeDepth), material(ROOF_RED));
  mesh.rotation.x = angle;
  mesh.position.z = z;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createGableFill(depth: number, rise: number, side: -1 | 1): THREE.Mesh {
  const shape = new THREE.Shape()
    .moveTo(-depth / 2, 0)
    .lineTo(0, rise)
    .lineTo(depth / 2, 0)
    .lineTo(-depth / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material(GABLE_FILL));
  mesh.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
  mesh.position.x = side;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildGableRoof(spec: PrefabRoofSpec): THREE.Group {
  const overhang = 0.12;
  const width = spec.wx + overhang * 2;
  const depth = spec.dz + overhang * 2;
  const rise = Math.max(0.55, Math.min(0.95, depth * 0.22));
  const halfDepth = depth / 2;
  const slopeDepth = Math.sqrt(halfDepth * halfDepth + rise * rise) + 0.1;
  const angle = Math.atan2(rise, halfDepth);
  const thickness = 0.12;

  const southSlope = createSlope(width, slopeDepth, thickness, -angle, -halfDepth / 2);
  southSlope.position.y = rise / 2 + 0.03;
  const northSlope = createSlope(width, slopeDepth, thickness, angle, halfDepth / 2);
  northSlope.position.y = rise / 2 + 0.03;

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, 0.08, 0.08), material(ROOF_TRIM));
  ridge.position.y = rise + 0.02;
  ridge.castShadow = true;
  ridge.receiveShadow = true;

  const eaveNorth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.08, 0.08), material(ROOF_TRIM));
  eaveNorth.position.set(0, 0.08, -halfDepth - 0.02);
  eaveNorth.castShadow = true;
  eaveNorth.receiveShadow = true;
  const eaveSouth = eaveNorth.clone();
  eaveSouth.position.z = halfDepth + 0.02;

  const westFill = createGableFill(depth, rise, -1);
  westFill.position.x = -(width / 2);
  const eastFill = createGableFill(depth, rise, 1);
  eastFill.position.x = width / 2;

  const group = new THREE.Group();
  group.add(southSlope, northSlope, ridge, eaveNorth, eaveSouth, westFill, eastFill);
  group.position.set(spec.x + (spec.wx - 1) / 2, spec.y + ROOF_BASE_Y, spec.z + (spec.dz - 1) / 2);
  return group;
}

function buildFlatRoof(spec: PrefabRoofSpec): THREE.Group {
  const width = spec.wx + 0.08;
  const depth = spec.dz + 0.08;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), material(ROOF_RED));
  slab.position.y = 0.08;
  slab.castShadow = true;
  slab.receiveShadow = true;

  const group = new THREE.Group();
  group.add(slab);

  const edgeNorth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.08, 0.08), material(ROOF_TRIM));
  edgeNorth.position.set(0, 0.12, -depth / 2);
  const edgeSouth = edgeNorth.clone();
  edgeSouth.position.z = depth / 2;
  const edgeWest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, depth + 0.04), material(ROOF_TRIM));
  edgeWest.position.set(-width / 2, 0.12, 0);
  const edgeEast = edgeWest.clone();
  edgeEast.position.x = width / 2;
  group.add(edgeNorth, edgeSouth, edgeWest, edgeEast);

  group.position.set(spec.x + (spec.wx - 1) / 2, spec.y + ROOF_BASE_Y, spec.z + (spec.dz - 1) / 2);
  return group;
}

export function buildPrefabRoof(spec: PrefabRoofSpec): THREE.Group {
  return spec.kind === "flat" ? buildFlatRoof(spec) : buildGableRoof(spec);
}
