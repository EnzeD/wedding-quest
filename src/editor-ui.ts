import type { EditorPaletteItem, EditorTab } from "./level-catalog.ts";
import type { LevelEntity } from "./types.ts";

interface EditorUiHandlers {
  onPick: (item: EditorPaletteItem) => void;
  onTab: (tab: EditorTab) => void;
  onSave: () => void;
  onReload: () => void;
  onPropChange: (field: string, value: string) => void;
  onEraseToggle: (enabled: boolean) => void;
}

const TAB_LABELS: Record<EditorTab, string> = {
  prefabs: "Prefabs",
  kenney: "Kenney",
  decor: "Decor",
  npc: "PNJ",
  surfaces: "Surfaces",
};

export class EditorUI {
  private items: EditorPaletteItem[];
  private handlers: EditorUiHandlers;
  private root: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private paletteEl: HTMLDivElement;
  private propsEl: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private eraseBtn: HTMLButtonElement;

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
          <button id="editor-save" class="editor-btn">Save</button>
          <button id="editor-reload" class="editor-btn">Reload</button>
          <button id="editor-erase" class="editor-btn">Erase</button>
        </div>
        <div class="editor-tabs"></div>
        <div class="editor-palette"></div>
      </div>
      <div class="editor-properties kenney-panel">
        <h3>Selection</h3>
        <div class="editor-props"></div>
        <div class="editor-status"></div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.tabsEl = this.root.querySelector(".editor-tabs") as HTMLDivElement;
    this.paletteEl = this.root.querySelector(".editor-palette") as HTMLDivElement;
    this.propsEl = this.root.querySelector(".editor-props") as HTMLDivElement;
    this.statusEl = this.root.querySelector(".editor-status") as HTMLDivElement;
    this.eraseBtn = this.root.querySelector("#editor-erase") as HTMLButtonElement;

    (this.root.querySelector("#editor-save") as HTMLButtonElement).addEventListener("click", () => handlers.onSave());
    (this.root.querySelector("#editor-reload") as HTMLButtonElement).addEventListener("click", () => handlers.onReload());
    this.eraseBtn.addEventListener("click", () => {
      this.eraseBtn.classList.toggle("selected");
      handlers.onEraseToggle(this.eraseBtn.classList.contains("selected"));
    });
    this.propsEl.addEventListener("change", (event) => this.onPropEvent(event));
    this.propsEl.addEventListener("input", (event) => this.onPropEvent(event));

    this.renderTabs();
    this.renderPalette();
    this.renderSelection(null);
  }

  setStatus(text: string, isError = false): void {
    this.statusEl.textContent = text;
    this.statusEl.classList.toggle("error", isError);
  }

  setActiveTab(tab: EditorTab): void {
    this.activeTab = tab;
    this.activeItemId = null;
    this.renderTabs();
    this.renderPalette();
  }

  setActiveItem(id: string | null): void {
    this.activeItemId = id;
    this.renderPalette();
  }

  renderSelection(entity: LevelEntity | null): void {
    if (!entity) {
      this.propsEl.innerHTML = `<p class="editor-empty">Aucune selection.</p>`;
      return;
    }

    this.propsEl.innerHTML = `
      <label>Nom<input data-field="name" value="${entity.name ?? ""}" /></label>
      <label>X<input data-field="position.x" type="number" step="0.5" value="${entity.position.x}" /></label>
      <label>Y<input data-field="position.y" type="number" step="0.5" value="${entity.position.y}" /></label>
      <label>Z<input data-field="position.z" type="number" step="0.5" value="${entity.position.z}" /></label>
      <label>Rotation Y<input data-field="rotationY" type="number" step="0.1963495408" value="${entity.rotationY}" /></label>
      <label>Scale<input data-field="scale" type="number" step="0.1" min="0.1" value="${entity.scale}" /></label>
      <label>Snap
        <select data-field="snap">
          <option value="grid" ${entity.snap === "grid" ? "selected" : ""}>grid</option>
          <option value="free" ${entity.snap === "free" ? "selected" : ""}>free</option>
        </select>
      </label>
      <div class="editor-meta">${entity.kind} / ${entity.assetId}</div>
    `;
  }

  private renderTabs(): void {
    this.tabsEl.innerHTML = "";
    (Object.keys(TAB_LABELS) as EditorTab[]).forEach((tab) => {
      const btn = document.createElement("button");
      btn.className = `editor-tab ${tab === this.activeTab ? "selected" : ""}`;
      btn.textContent = TAB_LABELS[tab];
      btn.addEventListener("click", () => {
        this.setActiveTab(tab);
        this.handlers.onTab(tab);
      });
      this.tabsEl.appendChild(btn);
    });
  }

  private renderPalette(): void {
    const items = this.items.filter((item) => item.tab === this.activeTab);
    this.paletteEl.innerHTML = "";
    for (const item of items) {
      const button = document.createElement("button");
      button.className = `editor-palette-item ${item.id === this.activeItemId ? "selected" : ""}`;
      button.textContent = item.label;
      button.addEventListener("click", () => {
        this.setActiveItem(item.id);
        this.handlers.onPick(item);
      });
      this.paletteEl.appendChild(button);
    }
  }

  private onPropEvent(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const field = target.dataset.field;
    if (!field) return;
    this.handlers.onPropChange(field, target.value);
  }
}
