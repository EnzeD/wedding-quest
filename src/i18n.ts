import type { EditorTab } from "./level-catalog.ts";

export type Locale = "fr" | "en";

export interface BilingualText {
  fr: string;
  en: string;
}

const searchParams = new URLSearchParams(window.location.search);

export const locale: Locale = searchParams.get("english") === "1" ? "en" : "fr";

export function bilingual(fr: string, en: string): BilingualText {
  return { fr, en };
}

export function localize(text: BilingualText): string {
  return text[locale];
}

const STATIC_TEXT = {
  "menu.placeholder": bilingual("Ton prenom", "Your first name"),
  "menu.play": bilingual("Jouer", "Play"),
  "score.title": bilingual("C'est l'heure !", "It's time!"),
  "score.replay": bilingual("Rejouer", "Play again"),
} as const;

export function applyDocumentTranslations(): void {
  document.documentElement.lang = locale;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as keyof typeof STATIC_TEXT | undefined;
    if (key) element.textContent = localize(STATIC_TEXT[key]);
  });

  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder as keyof typeof STATIC_TEXT | undefined;
    if (key) element.placeholder = localize(STATIC_TEXT[key]);
  });
}

export const controlsText = {
  sprint: bilingual("Courir", "Sprint"),
  jump: bilingual("Sauter", "Jump"),
};

export const characterText = {
  sarah: bilingual("Sarah", "Sarah"),
  nicolas: bilingual("Nicolas", "Nicolas"),
  bride: bilingual("La mariee", "The bride"),
  groom: bilingual("Le marie", "The groom"),
};

export const menuText = {
  kicker: bilingual("Sarah + Nicolas presentent", "Sarah + Nicolas present"),
  title: bilingual("The Wedding Quest!", "The Wedding Quest!"),
  tagline: bilingual("La ceremonie approche. Panique avec style.", "The ceremony is looming. Panic with style."),
  start: bilingual("Declencher la panique !", "Start the panic!"),
  selectKicker: bilingual("Une ceremonie. Deux catastrophes.", "One ceremony. Two disasters."),
  selectTitle: bilingual("Choisis ton joueur", "Choose your player"),
  selectCopy: bilingual(
    "Choisis ton icone du chaos, entre ton prenom, puis rends ca officiel.",
    "Pick a chaos icon, enter your name, then make it official.",
  ),
  nameLabel: bilingual("Ton prenom", "Your name"),
  confirm: bilingual("A la ceremonie !", "To the ceremony!"),
};

export const hudText = {
  fps: bilingual("-- FPS", "-- FPS"),
  items: bilingual("Objets", "Items"),
  timeBonus: bilingual("Bonus temps", "Time bonus"),
  completionBonus: bilingual("Bonus completion", "Completion bonus"),
  totalScore: bilingual("Score total", "Total score"),
};

export const editorText = {
  tabs: {
    prefabs: bilingual("Prefabs", "Prefabs"),
    kenney: bilingual("Kenney", "Kenney"),
    decor: bilingual("Deco", "Decor"),
    items: bilingual("Objets", "Items"),
    npc: bilingual("PNJ", "NPCs"),
    surfaces: bilingual("Surfaces", "Surfaces"),
    menu: bilingual("Menu", "Menu"),
  } satisfies Record<EditorTab, BilingualText>,
  buttons: {
    save: bilingual("Sauver", "Save"),
    reload: bilingual("Recharger", "Reload"),
    erase: bilingual("Effacer", "Erase"),
    startAngle: bilingual("Set start angle", "Set start angle"),
    reset: bilingual("Reset", "Reset"),
    fxOn: bilingual("FX ON", "FX ON"),
    fxOff: bilingual("FX OFF", "FX OFF"),
  },
  sections: {
    selection: bilingual("Selection", "Selection"),
    look: bilingual("Rendu", "Look"),
  },
  help: bilingual(
    "Apercu en direct. Sauver enregistre le toggle FX et le color grading dans le JSON du niveau.",
    "Live preview. Save writes the FX toggle and color grading values to the level JSON.",
  ),
  selectionEmpty: bilingual("Aucune selection.", "No selection."),
  fields: {
    name: bilingual("Nom", "Name"),
    rotationY: bilingual("Rotation Y", "Y Rotation"),
    scale: bilingual("Echelle", "Scale"),
    characterHeight: bilingual("Hauteur persos", "Character height"),
    snap: bilingual("Snap", "Snap"),
    grassColor: bilingual("Brins d'herbe", "Grass blades"),
    waterTerrain: bilingual("Terrain de l'eau", "Water terrain"),
    grid: bilingual("grille", "grid"),
    free: bilingual("libre", "free"),
  },
  grading: {
    contrast: bilingual("Contraste", "Contrast"),
    saturation: bilingual("Saturation", "Saturation"),
    warmth: bilingual("Chaleur", "Warmth"),
    vignette: bilingual("Vignette", "Vignette"),
    lift: bilingual("Lift", "Lift"),
  },
  surfaces: {
    pathBleed: bilingual("Debord chemin", "Path bleed"),
    pathRadius: bilingual("Rayon chemin", "Path radius"),
    waterBleed: bilingual("Debord eau", "Water bleed"),
    waterRadius: bilingual("Rayon eau", "Water radius"),
    waterDepth: bilingual("Profondeur eau", "Water depth"),
    bankSlope: bilingual("Pente de berge", "Bank slope"),
    shoreWarp: bilingual("Naturalisme de rive", "Shore naturalness"),
    bedVariation: bilingual("Variation du fond", "Bed variation"),
  },
  status: {
    active: bilingual("Mode editeur actif", "Editor mode active"),
    saveOk: bilingual("Sauvegarde OK", "Save OK"),
    reloaded: bilingual("Niveau recharge", "Level reloaded"),
    startAngleSet: bilingual("Angle de depart menu capture", "Menu start angle captured"),
  },
};

export function formatLevelLoadError(status: number): string {
  return localize(bilingual(`Impossible de charger le niveau : ${status}`, `Failed to load level: ${status}`));
}

export function formatLevelSaveError(status: number): string {
  return localize(bilingual(`Impossible de sauver le niveau : ${status}`, `Failed to save level: ${status}`));
}
