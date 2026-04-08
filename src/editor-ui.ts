import type { EditorPaletteItem, EditorTab } from "./level-catalog.ts";
import { editorText, localize } from "./i18n.ts";
import type { ColorGradingSettings, LevelEntity, LevelEntityKind, LevelSurfaceSettings, SurfaceSettingField } from "./types.ts";

interface EditorUiHandlers {
  onPick: (item: EditorPaletteItem) => void;
  onTab: (tab: EditorTab) => void;
  onSave: () => void;
  onReload: () => void;
  onPropChange: (field: string, value: string) => void;
  onGrassColorChange: (value: string) => void;
  onSurfaceSettingChange: (surface: "path" | "water", field: SurfaceSettingField, value: number) => void;
  onPostProcessingToggle: (enabled: boolean) => void;
  onColorGradingChange: (field: keyof ColorGradingSettings, value: number) => void;
  onColorGradingReset: () => void;
  onEraseToggle: (enabled: boolean) => void;
  getPreview: (item: EditorPaletteItem) => string | null;
  onPreviewNeeded: (item: EditorPaletteItem) => void;
}

const TAB_LABELS: Record<EditorTab, string> = Object.fromEntries(
  Object.entries(editorText.tabs).map(([tab, label]) => [tab, localize(label)]),
) as Record<EditorTab, string>;

const COLOR_GRADING_FIELDS: Array<{
  field: keyof ColorGradingSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  digits: number;
}> = [
  { field: "contrast", label: localize(editorText.grading.contrast), min: 0.5, max: 1.8, step: 0.01, digits: 2 },
  { field: "saturation", label: localize(editorText.grading.saturation), min: 0, max: 2, step: 0.01, digits: 2 },
  { field: "warmth", label: localize(editorText.grading.warmth), min: -0.3, max: 0.3, step: 0.01, digits: 2 },
  { field: "vignette", label: localize(editorText.grading.vignette), min: 0, max: 1.5, step: 0.01, digits: 2 },
  { field: "lift", label: localize(editorText.grading.lift), min: -0.2, max: 0.2, step: 0.005, digits: 3 },
];
const SURFACE_FIELDS = [
  { surface: "path", field: "bleed", label: localize(editorText.surfaces.pathBleed), min: 0, max: 0.2, step: 0.01, digits: 2 },
  { surface: "path", field: "radius", label: localize(editorText.surfaces.pathRadius), min: 0, max: 0.6, step: 0.01, digits: 2 },
  { surface: "water", field: "bleed", label: localize(editorText.surfaces.waterBleed), min: 0, max: 0.24, step: 0.01, digits: 2 },
  { surface: "water", field: "radius", label: localize(editorText.surfaces.waterRadius), min: 0, max: 0.6, step: 0.01, digits: 2 },
  { surface: "water", field: "depth", label: localize(editorText.surfaces.waterDepth), min: 0, max: 1.6, step: 0.01, digits: 2 },
  { surface: "water", field: "bankSlope", label: localize(editorText.surfaces.bankSlope), min: 0.35, max: 2.5, step: 0.01, digits: 2 },
  { surface: "water", field: "shoreWarp", label: localize(editorText.surfaces.shoreWarp), min: 0, max: 1.2, step: 0.01, digits: 2 },
  { surface: "water", field: "bedVariation", label: localize(editorText.surfaces.bedVariation), min: 0, max: 0.2, step: 0.005, digits: 3 },
] as const;

function labelEntityKind(kind: LevelEntityKind): string {
  if (kind === "pickup") return TAB_LABELS.items;
  if (kind === "npc") return TAB_LABELS.npc;
  if (kind === "vegetation" || kind === "decoration") return TAB_LABELS.decor;
  return kind === "kenney-piece" ? TAB_LABELS.kenney : TAB_LABELS.prefabs;
}

export class EditorUI {
  private items: EditorPaletteItem[];
  private handlers: EditorUiHandlers;
  private root: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private paletteEl: HTMLDivElement;
  private propsEl: HTMLDivElement;
  private lookEl: HTMLDivElement;
  private gradingEl: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private eraseBtn: HTMLButtonElement;
  private fxBtn: HTMLButtonElement;
  private paletteButtons = new Map<string, HTMLButtonElement>();
  private previewObserver: IntersectionObserver | null = null;
  activeTab: EditorTab = "prefabs";
  activeItemId: string | null = null;
  constructor(items: EditorPaletteItem[], handlers: EditorUiHandlers) {
    this.items = items;
    this.handlers = handlers;
    this.root = document.createElement("div");
    this.root.id = "editor-root";
    this.root.innerHTML = `
      <div class="editor-sidebar kenney-panel">
        <div class="editor-toolbar">
          <button id="editor-save" class="editor-btn">${localize(editorText.buttons.save)}</button>
          <button id="editor-reload" class="editor-btn">${localize(editorText.buttons.reload)}</button>
          <button id="editor-erase" class="editor-btn">${localize(editorText.buttons.erase)}</button>
        </div>
        <div class="editor-tabs"></div>
        <div class="editor-palette"></div>
      </div>
      <div class="editor-properties kenney-panel">
        <section class="editor-section">
          <h3>${localize(editorText.sections.selection)}</h3>
          <div class="editor-props"></div>
        </section>
        <section class="editor-section">
          <div class="editor-section-head">
            <h3>${localize(editorText.sections.look)}</h3>
            <div class="editor-actions">
              <button id="editor-fx-toggle" class="editor-btn editor-btn-secondary">${localize(editorText.buttons.fxOn)}</button>
              <button id="editor-grade-reset" class="editor-btn editor-btn-secondary">${localize(editorText.buttons.reset)}</button>
            </div>
          </div>
          <p class="editor-help">${localize(editorText.help)}</p>
          <div class="editor-look"></div>
          <div class="editor-grading"></div>
        </section>
        <div class="editor-status"></div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.tabsEl = this.root.querySelector(".editor-tabs") as HTMLDivElement;
    this.paletteEl = this.root.querySelector(".editor-palette") as HTMLDivElement;
    this.propsEl = this.root.querySelector(".editor-props") as HTMLDivElement;
    this.lookEl = this.root.querySelector(".editor-look") as HTMLDivElement;
    this.gradingEl = this.root.querySelector(".editor-grading") as HTMLDivElement;
    this.statusEl = this.root.querySelector(".editor-status") as HTMLDivElement;
    this.eraseBtn = this.root.querySelector("#editor-erase") as HTMLButtonElement;
    this.fxBtn = this.root.querySelector("#editor-fx-toggle") as HTMLButtonElement;

    (this.root.querySelector("#editor-save") as HTMLButtonElement).addEventListener("click", () => handlers.onSave());
    (this.root.querySelector("#editor-reload") as HTMLButtonElement).addEventListener("click", () => handlers.onReload());
    (this.root.querySelector("#editor-grade-reset") as HTMLButtonElement).addEventListener("click", () => handlers.onColorGradingReset());
    this.fxBtn.addEventListener("click", () => handlers.onPostProcessingToggle(!this.fxBtn.classList.contains("selected")));
    this.eraseBtn.addEventListener("click", () => {
      this.eraseBtn.classList.toggle("selected");
      handlers.onEraseToggle(this.eraseBtn.classList.contains("selected"));
    });
    this.propsEl.addEventListener("change", (event) => this.onPropEvent(event));
    this.propsEl.addEventListener("input", (event) => this.onPropEvent(event));
    this.lookEl.addEventListener("change", (event) => this.onLookEvent(event));
    this.lookEl.addEventListener("input", (event) => this.onLookEvent(event));
    this.gradingEl.addEventListener("change", (event) => this.onColorGradingEvent(event));
    this.gradingEl.addEventListener("input", (event) => this.onColorGradingEvent(event));

    this.renderTabs();
    this.renderPalette();
    this.renderSelection(null);
  }
  setPostProcessingEnabled(enabled: boolean): void {
    this.fxBtn.textContent = enabled ? localize(editorText.buttons.fxOn) : localize(editorText.buttons.fxOff);
    this.fxBtn.classList.toggle("selected", enabled);
  }
  setStatus(text: string, isError = false): void {
    this.statusEl.textContent = text;
    this.statusEl.classList.toggle("error", isError);
  }
  setActiveTab(tab: EditorTab): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.activeItemId = null;
    this.renderTabs();
    this.renderPalette();
  }
  setActiveItem(id: string | null): void {
    if (this.activeItemId && this.paletteButtons.has(this.activeItemId)) this.paletteButtons.get(this.activeItemId)?.classList.remove("selected");
    this.activeItemId = id;
    if (id && this.paletteButtons.has(id)) this.paletteButtons.get(id)?.classList.add("selected");
  }
  updatePreview(itemId: string, preview: string): void {
    const button = this.paletteButtons.get(itemId);
    if (!button) return;
    const thumb = button.querySelector(".editor-palette-thumb");
    if (!thumb) return;
    thumb.innerHTML = `<img src="${preview}" alt="${button.dataset.label ?? itemId}" />`;
  }
  renderSelection(entity: LevelEntity | null): void {
    if (!entity) {
      this.propsEl.innerHTML = `<p class="editor-empty">${localize(editorText.selectionEmpty)}</p>`;
      return;
    }

    this.propsEl.innerHTML = `
      <label>${localize(editorText.fields.name)}<input data-field="name" value="${entity.name ?? ""}" /></label>
      <label>X<input data-field="position.x" type="number" step="0.5" value="${entity.position.x}" /></label>
      <label>Y<input data-field="position.y" type="number" step="0.5" value="${entity.position.y}" /></label>
      <label>Z<input data-field="position.z" type="number" step="0.5" value="${entity.position.z}" /></label>
      <label>${localize(editorText.fields.rotationY)}<input data-field="rotationY" type="number" step="0.1963495408" value="${entity.rotationY}" /></label>
      <label>${localize(editorText.fields.scale)}<input data-field="scale" type="number" step="0.1" min="0.1" value="${entity.scale}" /></label>
      <label>${localize(editorText.fields.snap)}
        <select data-field="snap">
          <option value="grid" ${entity.snap === "grid" ? "selected" : ""}>${localize(editorText.fields.grid)}</option>
          <option value="free" ${entity.snap === "free" ? "selected" : ""}>${localize(editorText.fields.free)}</option>
        </select>
      </label>
      <div class="editor-meta">${labelEntityKind(entity.kind)} / ${entity.assetId}</div>
    `;
  }
  renderColorGrading(settings: ColorGradingSettings): void {
    if (!this.gradingEl.childElementCount) {
      this.gradingEl.innerHTML = COLOR_GRADING_FIELDS.map(({ field, label, min, max, step }) => `
        <label class="editor-grade-field"><span>${label}<output class="editor-grade-value" data-grade-output="${field}"></output></span><input data-grade-field="${field}" type="range" min="${min}" max="${max}" step="${step}" /></label>
      `).join("");
    }
    for (const { field, digits } of COLOR_GRADING_FIELDS) {
      const value = settings[field];
      const input = this.gradingEl.querySelector(`[data-grade-field="${field}"]`) as HTMLInputElement | null;
      const output = this.gradingEl.querySelector(`[data-grade-output="${field}"]`) as HTMLOutputElement | null;
      if (input) input.value = String(value);
      if (output) output.textContent = value.toFixed(digits);
    }
  }
  renderLookSettings(color: string, surfaceSettings: LevelSurfaceSettings): void {
    if (!this.lookEl.childElementCount) {
      this.lookEl.innerHTML = `
        <label class="editor-look-field"><span>${localize(editorText.fields.grassColor)}</span><input data-look-field="grassColor" type="color" /></label>
        <div class="editor-meta">${localize(editorText.fields.waterTerrain)}</div>
        ${SURFACE_FIELDS.map(({ surface, field, label, min, max, step }) => `<label class="editor-grade-field"><span>${label}<output class="editor-grade-value" data-surface-output="${surface}.${field}"></output></span><input data-surface-kind="${surface}" data-surface-field="${field}" type="range" min="${min}" max="${max}" step="${step}" /></label>`).join("")}
      `;
    }
    const input = this.lookEl.querySelector('[data-look-field="grassColor"]') as HTMLInputElement | null;
    if (input) input.value = color;
    for (const { surface, field, digits } of SURFACE_FIELDS) {
      const value = surfaceSettings[surface][field];
      const slider = this.lookEl.querySelector(`[data-surface-kind="${surface}"][data-surface-field="${field}"]`) as HTMLInputElement | null;
      const output = this.lookEl.querySelector(`[data-surface-output="${surface}.${field}"]`) as HTMLOutputElement | null;
      if (slider) slider.value = String(value);
      if (output) output.textContent = value.toFixed(digits);
    }
  }
  private renderTabs(): void {
    this.tabsEl.innerHTML = "";
    (Object.keys(TAB_LABELS) as EditorTab[]).forEach((tab) => {
      const btn = document.createElement("button");
      btn.className = `editor-tab ${tab === this.activeTab ? "selected" : ""}`;
      btn.textContent = TAB_LABELS[tab];
      btn.addEventListener("click", () => { this.setActiveTab(tab); this.handlers.onTab(tab); });
      this.tabsEl.appendChild(btn);
    });
  }
  private renderPalette(): void {
    const items = this.items.filter((item) => item.tab === this.activeTab);
    this.previewObserver?.disconnect();
    this.paletteButtons.clear();
    this.paletteEl.innerHTML = "";
    for (const item of items) {
      const button = document.createElement("button");
      button.className = `editor-palette-item ${item.id === this.activeItemId ? "selected" : ""}`;
      button.dataset.itemId = item.id;
      button.dataset.label = item.label;
      const preview = this.handlers.getPreview(item);
      button.innerHTML = `
        <span class="editor-palette-thumb">${preview ? `<img src="${preview}" alt="${item.label}" />` : `<span class="editor-thumb-placeholder">${item.label.slice(0, 2).toUpperCase()}</span>`}</span>
        <span class="editor-palette-label">${item.label}</span>
      `;
      button.addEventListener("click", () => { this.setActiveItem(item.id); this.handlers.onPick(item); });
      this.paletteButtons.set(item.id, button);
      this.paletteEl.appendChild(button);
    }
    this.bindPreviewObserver(items);
  }
  private bindPreviewObserver(items: EditorPaletteItem[]): void {
    const byId = new Map(items.map((item) => [item.id, item]));
    this.previewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const button = entry.target as HTMLButtonElement;
          if (button.dataset.previewRequested === "1") continue;
          const item = byId.get(button.dataset.itemId ?? "");
          if (!item || this.handlers.getPreview(item)) continue;
          button.dataset.previewRequested = "1";
          this.handlers.onPreviewNeeded(item);
        }
      },
      { root: this.paletteEl, rootMargin: "120px 0px" },
    );
    for (const button of this.paletteButtons.values()) this.previewObserver.observe(button);
  }
  private onPropEvent(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const field = target.dataset.field;
    if (!field) return;
    this.handlers.onPropChange(field, target.value);
  }
  private onLookEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.dataset.lookField === "grassColor") {
      this.handlers.onGrassColorChange(target.value);
      return;
    }
    const surface = target.dataset.surfaceKind as "path" | "water" | undefined;
    const field = target.dataset.surfaceField as SurfaceSettingField | undefined;
    const value = Number(target.value);
    const config = SURFACE_FIELDS.find((item) => item.surface === surface && item.field === field);
    if (!surface || !field || !config || !Number.isFinite(value)) return;
    const output = this.lookEl.querySelector(`[data-surface-output="${surface}.${field}"]`) as HTMLOutputElement | null;
    if (output) output.textContent = value.toFixed(config.digits);
    this.handlers.onSurfaceSettingChange(surface, field, value);
  }
  private onColorGradingEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    const field = target.dataset.gradeField as keyof ColorGradingSettings | undefined;
    const value = Number(target.value);
    const config = COLOR_GRADING_FIELDS.find((item) => item.field === field);
    if (!field || !config || !Number.isFinite(value)) return;
    const output = this.gradingEl.querySelector(`[data-grade-output="${field}"]`) as HTMLOutputElement | null;
    if (output) output.textContent = value.toFixed(config.digits);
    this.handlers.onColorGradingChange(field, value);
  }
}
