import { DECO_PIECES, PREFAB_DEFINITIONS, TREE_PIECES } from "./kenney-buildings.ts";
import { bilingual, localize } from "./i18n.ts";
import { getPickupDefinitions } from "./item-definitions.ts";
import type { LevelEntityKind, LevelSnapMode } from "./types.ts";

export type EditorTab = "prefabs" | "kenney" | "decor" | "items" | "npc" | "surfaces";
export type SurfaceTool = "path" | "water";

export interface EditorPaletteItem {
  id: string;
  label: string;
  tab: EditorTab;
  kind?: LevelEntityKind;
  defaultScale?: number;
  defaultSnap?: LevelSnapMode;
  surfaceTool?: SurfaceTool;
}

interface KenneyCatalog {
  pieces: Record<string, { category: string; subcategory?: string }>;
}

interface MiniCharacterCatalog {
  characters: {
    male: string[];
    female: string[];
  };
}

const PREFAB_LABELS = {
  manoir: bilingual("Manoir", "Manor"),
  grange: bilingual("Grange", "Barn"),
  cottage: bilingual("Cottage", "Cottage"),
  annexe: bilingual("Annexe", "Annex"),
  moulin: bilingual("Moulin", "Mill"),
} as const;

const SURFACE_LABELS = {
  path: bilingual("Chemin", "Path"),
  water: bilingual("Eau", "Water"),
} as const;

function labelize(name: string): string {
  return name
    .replace(/\.glb$/i, "")
    .split(/[-_]/g)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export async function loadEditorCatalog(): Promise<EditorPaletteItem[]> {
  const [kenney, mini] = await Promise.all([
    fetch("/kenney-catalog.json").then((res) => res.json() as Promise<KenneyCatalog>),
    fetch("/kenney-mini-characters.json").then((res) => res.json() as Promise<MiniCharacterCatalog>),
  ]);

  const prefabItems: EditorPaletteItem[] = PREFAB_DEFINITIONS.map((prefab) => ({
    id: prefab.id,
    label: localize(PREFAB_LABELS[prefab.id as keyof typeof PREFAB_LABELS] ?? bilingual(prefab.label, prefab.label)),
    tab: "prefabs",
    kind: "prefab",
    defaultScale: prefab.defaultScale,
    defaultSnap: "grid",
  }));

  const kenneyItems: EditorPaletteItem[] = Object.keys(kenney.pieces)
    .sort()
    .map((id) => ({
      id,
      label: labelize(id),
      tab: "kenney",
      kind: "kenney-piece",
      defaultScale: 1.5,
      defaultSnap: "grid",
    }));

  const decorIds = [...TREE_PIECES, ...DECO_PIECES];
  const decorItems: EditorPaletteItem[] = decorIds.map((id) => ({
    id,
    label: labelize(id),
    tab: "decor",
    kind: TREE_PIECES.includes(id) ? "vegetation" : "decoration",
    defaultScale: TREE_PIECES.includes(id) ? 3 : 2,
    defaultSnap: TREE_PIECES.includes(id) ? "free" : "free",
  }));

  const npcItems: EditorPaletteItem[] = [...mini.characters.male, ...mini.characters.female].map((name) => {
    const id = name.replace(/\.glb$/i, "");
    return {
      id,
      label: labelize(id),
      tab: "npc",
      kind: "npc",
      defaultScale: 1.8,
      defaultSnap: "free",
    };
  });

  const pickupItems: EditorPaletteItem[] = getPickupDefinitions().map((item) => ({
    id: item.id,
    label: item.editorLabel,
    tab: "items",
    kind: "pickup",
    defaultScale: 0.8,
    defaultSnap: "free",
  }));

  const surfaceItems: EditorPaletteItem[] = [
    { id: "path", label: localize(SURFACE_LABELS.path), tab: "surfaces", surfaceTool: "path" },
    { id: "water", label: localize(SURFACE_LABELS.water), tab: "surfaces", surfaceTool: "water" },
  ];

  return [...prefabItems, ...kenneyItems, ...decorItems, ...pickupItems, ...npcItems, ...surfaceItems];
}
