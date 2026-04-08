import * as THREE from "three";
import { bilingual, localize, type BilingualText } from "./i18n.ts";
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
  name: BilingualText;
  points: number;
}

const DEFAULT_PICKUP_POSITIONS: [number, number][] = [
  [-5, 5], [10, 8], [5, 20], [-8, -3], [20, 5],
  [-15, 18], [25, -15], [-20, -10], [14, -5], [30, -20],
];

const NICOLAS_ITEMS: PickupSeed[] = [
  { slug: "boutonniere", name: bilingual("Boutonniere", "Boutonniere"), points: 50 },
  { slug: "boutons-manchettes", name: bilingual("Boutons de manchettes", "Cufflinks"), points: 50 },
  { slug: "cravate", name: bilingual("Cravate", "Tie"), points: 100 },
  { slug: "montre", name: bilingual("Montre", "Watch"), points: 200 },
  { slug: "chaussures", name: bilingual("Chaussures", "Shoes"), points: 300 },
  { slug: "voeux", name: bilingual("Les voeux", "Vows"), points: 300 },
  { slug: "pantalon", name: bilingual("Pantalon", "Trousers"), points: 400 },
  { slug: "chemise", name: bilingual("Chemise", "Shirt"), points: 400 },
  { slug: "veste", name: bilingual("Veste", "Jacket"), points: 400 },
  { slug: "alliances", name: bilingual("Les alliances", "Wedding rings"), points: 1000 },
];

const SARAH_ITEMS: PickupSeed[] = [
  { slug: "bracelet", name: bilingual("Bracelet", "Bracelet"), points: 50 },
  { slug: "lentilles", name: bilingual("Lentilles", "Contact lenses"), points: 50 },
  { slug: "boucles-oreilles", name: bilingual("Boucles d'oreilles", "Earrings"), points: 100 },
  { slug: "maquillage", name: bilingual("Trousse de maquillage", "Makeup bag"), points: 100 },
  { slug: "voile", name: bilingual("Voile", "Veil"), points: 200 },
  { slug: "voeux", name: bilingual("Les voeux", "Vows"), points: 300 },
  { slug: "chaussures", name: bilingual("Chaussures", "Shoes"), points: 400 },
  { slug: "bouquet", name: bilingual("Bouquet", "Bouquet"), points: 400 },
  { slug: "robe", name: bilingual("Robe", "Dress"), points: 500 },
  { slug: "alliances", name: bilingual("Les alliances", "Wedding rings"), points: 1000 },
];

function buildDefinitions(character: Character, seeds: PickupSeed[]): PickupDefinition[] {
  const characterLabel = character[0].toUpperCase() + character.slice(1);
  return seeds.map(({ slug, name, points }) => ({
    id: `${character}-${slug}`,
    name: localize(name),
    points,
    character,
    editorLabel: `${characterLabel} - ${localize(name)}`,
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
