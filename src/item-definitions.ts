import * as THREE from "three";
import type { Character } from "./types.ts";

export interface PickupDefinition {
  id: string;
  name: string;
  points: number;
  character: Character;
  editorLabel: string;
}

interface PickupSeed {
  slug: string;
  name: string;
  points: number;
}

const DEFAULT_PICKUP_POSITIONS: [number, number][] = [
  [-5, 5], [10, 8], [5, 20], [-8, -3], [20, 5],
  [-15, 18], [25, -15], [-20, -10], [14, -5], [30, -20],
];

const NICOLAS_ITEMS: PickupSeed[] = [
  { slug: "boutonniere", name: "Boutonniere", points: 50 },
  { slug: "boutons-manchettes", name: "Boutons de manchettes", points: 50 },
  { slug: "cravate", name: "Cravate", points: 100 },
  { slug: "montre", name: "Montre", points: 200 },
  { slug: "chaussures", name: "Chaussures", points: 300 },
  { slug: "voeux", name: "Les voeux", points: 300 },
  { slug: "pantalon", name: "Pantalon", points: 400 },
  { slug: "chemise", name: "Chemise", points: 400 },
  { slug: "veste", name: "Veste", points: 400 },
  { slug: "alliances", name: "Les alliances", points: 1000 },
];

const SARAH_ITEMS: PickupSeed[] = [
  { slug: "bracelet", name: "Bracelet", points: 50 },
  { slug: "lentilles", name: "Lentilles", points: 50 },
  { slug: "boucles-oreilles", name: "Boucles d'oreilles", points: 100 },
  { slug: "maquillage", name: "Trousse de maquillage", points: 100 },
  { slug: "voile", name: "Voile", points: 200 },
  { slug: "voeux", name: "Les voeux", points: 300 },
  { slug: "chaussures", name: "Chaussures", points: 400 },
  { slug: "bouquet", name: "Bouquet", points: 400 },
  { slug: "robe", name: "Robe", points: 500 },
  { slug: "alliances", name: "Les alliances", points: 1000 },
];

function buildDefinitions(character: Character, seeds: PickupSeed[]): PickupDefinition[] {
  const characterLabel = character[0].toUpperCase() + character.slice(1);
  return seeds.map(({ slug, name, points }) => ({
    id: `${character}-${slug}`,
    name,
    points,
    character,
    editorLabel: `${characterLabel} - ${name}`,
  }));
}

const PICKUP_DEFINITIONS = [
  ...buildDefinitions("nicolas", NICOLAS_ITEMS),
  ...buildDefinitions("sarah", SARAH_ITEMS),
];

const PICKUP_BY_ID = new Map(PICKUP_DEFINITIONS.map((item) => [item.id, item]));

export function getPickupDefinition(id: string): PickupDefinition | null {
  return PICKUP_BY_ID.get(id) ?? null;
}

export function getPickupDefinitions(character?: Character): PickupDefinition[] {
  if (!character) return [...PICKUP_DEFINITIONS];
  return PICKUP_DEFINITIONS.filter((item) => item.character === character);
}

export function createFallbackPickupDefs(character: Character) {
  return getPickupDefinitions(character).map((item, index) => {
    const [x, z] = DEFAULT_PICKUP_POSITIONS[index % DEFAULT_PICKUP_POSITIONS.length];
    return {
      id: item.id,
      name: item.name,
      points: item.points,
      position: new THREE.Vector3(x, 0, z),
      scale: 0.8,
      rotationY: 0,
    };
  });
}
