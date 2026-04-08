import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createEntityFromPaletteItem, setEntityField, snapPoint } from "./editor-entity.ts";
import { EditorPlacementPreview } from "./editor-placement-preview.ts";
import { EditorPreviewStore } from "./editor-preview.ts";
import { EditorUI } from "./editor-ui.ts";
import { loadEditorCatalog, type EditorPaletteItem, type SurfaceTool } from "./level-catalog.ts";
import { loadLevel, saveLevel } from "./level-data.ts";
import { cellKey, cloneLevel, getCell, setCell, worldToCell } from "./level-grid.ts";
import { MapScene } from "./map.ts";
import { DEFAULT_COLOR_GRADING } from "./color-grading.ts";
import { normalizeSurfaceSettings } from "./surface-settings.ts";
import type { ColorGradingSettings, LevelData, LevelSurfaceSettings, SurfaceSettingField } from "./types.ts";

interface LevelEditorOptions {
  setColorGrading: (value: Partial<ColorGradingSettings>) => ColorGradingSettings;
  setPostProcessingEnabled: (enabled: boolean) => boolean;
}
export class LevelEditor {
  private mapScene: MapScene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private ui: EditorUI | null = null;
  private placementPreview: EditorPlacementPreview;
  private selectionBox = new THREE.BoxHelper(undefined, 0xffb349);
  private previews = new EditorPreviewStore();

  private level: LevelData;
  private activeItem: EditorPaletteItem | null = null;
  private selectedEntityId: string | null = null;
  private dragging = false;
  private painting = false;
  private eraseMode = false;
  private lastPaintKey: string | null = null;
  private setColorGrading: LevelEditorOptions["setColorGrading"];
  private setPostProcessingEnabled: LevelEditorOptions["setPostProcessingEnabled"];
  private constructor(renderer: THREE.WebGLRenderer, camera: THREE.Camera, mapScene: MapScene, level: LevelData, options: LevelEditorOptions) {
    this.renderer = renderer;
    this.camera = camera;
    this.mapScene = mapScene;
    this.level = cloneLevel(level);
    this.setColorGrading = options.setColorGrading;
    this.setPostProcessingEnabled = options.setPostProcessingEnabled;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 120;
    this.camera.position.set(0, 42, 20);

    this.placementPreview = new EditorPlacementPreview(this.level.metadata.size, (object) => this.mapScene.addOverlay(object));
    this.mapScene.addOverlay(this.selectionBox);
    this.selectionBox.visible = false;

    this.renderer.domElement.addEventListener("pointerdown", (event) => void this.onPointerDown(event));
    window.addEventListener("pointermove", (event) => void this.onPointerMove(event));
    window.addEventListener("pointerup", () => this.onPointerUp());
    window.addEventListener("keydown", (event) => void this.onKeyDown(event));
  }
  static async create(renderer: THREE.WebGLRenderer, camera: THREE.Camera, mapScene: MapScene, level: LevelData, options: LevelEditorOptions): Promise<LevelEditor> {
    const editor = new LevelEditor(renderer, camera, mapScene, level, options);
    const catalog = await loadEditorCatalog();
    editor.ui = new EditorUI(catalog, {
      onPick: (item) => {
        editor.activeItem = item;
        editor.selectEntity(null);
        editor.placementPreview.setItem(item);
      },
      onTab: () => {
        editor.activeItem = null;
        editor.placementPreview.setItem(null);
      },
      onSave: () => void editor.save(),
      onReload: () => void editor.reload(),
      onPropChange: (field, value) => void editor.updateSelected(field, value),
      onGrassColorChange: (value) => { editor.level.grassColor = value; editor.mapScene.updateGrassColor(value); },
      onSurfaceSettingChange: (surface, field, value) => editor.updateSurfaceSetting(surface, field, value),
      onPostProcessingToggle: (enabled) => {
        editor.level.postProcessingEnabled = editor.setPostProcessingEnabled(enabled);
        editor.ui?.setPostProcessingEnabled(editor.level.postProcessingEnabled);
      },
      onColorGradingChange: (field, value) => { editor.level.colorGrading = editor.setColorGrading({ ...editor.level.colorGrading, [field]: value }); },
      onColorGradingReset: () => { editor.level.colorGrading = editor.setColorGrading(DEFAULT_COLOR_GRADING); editor.ui?.renderColorGrading(editor.level.colorGrading); },
      onEraseToggle: (enabled) => { editor.eraseMode = enabled; },
      getPreview: (item) => editor.previews.get(item),
      onPreviewNeeded: (item) => { void editor.previews.ensure(item).then((preview) => preview && editor.ui?.updatePreview(item.id, preview)); },
    });
    editor.level.postProcessingEnabled = editor.setPostProcessingEnabled(editor.level.postProcessingEnabled);
    editor.ui.setPostProcessingEnabled(editor.level.postProcessingEnabled);
    editor.mapScene.updateGrassColor(editor.level.grassColor);
    editor.mapScene.updateSurfaceSettings(editor.level.surfaceSettings);
    editor.ui.renderLookSettings(editor.level.grassColor, editor.level.surfaceSettings);
    editor.level.colorGrading = editor.setColorGrading(editor.level.colorGrading);
    editor.ui.renderColorGrading(editor.level.colorGrading);
    editor.ui.setStatus("Editor mode actif");
    return editor;
  }
  update(): void { this.controls.update(); this.refreshSelectionBox(); }
  private async save(): Promise<void> {
    if (!this.ui) return;
    try {
      await saveLevel(this.level);
      await this.reload("Sauvegarde OK");
    } catch (error) {
      this.ui.setStatus((error as Error).message, true);
    }
  }
  private async reload(status = "Niveau recharge"): Promise<void> {
    if (!this.ui) return;
    try {
      this.level = await loadLevel();
      await this.mapScene.load(this.level);
      this.level.postProcessingEnabled = this.setPostProcessingEnabled(this.level.postProcessingEnabled);
      this.mapScene.updateGrassColor(this.level.grassColor);
      this.mapScene.updateSurfaceSettings(this.level.surfaceSettings);
      this.level.colorGrading = this.setColorGrading(this.level.colorGrading);
      this.placementPreview.setItem(this.activeItem);
      this.selectEntity(null);
      this.ui.setPostProcessingEnabled(this.level.postProcessingEnabled);
      this.ui.renderLookSettings(this.level.grassColor, this.level.surfaceSettings);
      this.ui.renderColorGrading(this.level.colorGrading);
      this.ui.setStatus(status);
    } catch (error) {
      this.ui.setStatus((error as Error).message, true);
    }
  }
  private async onPointerDown(event: PointerEvent): Promise<void> {
    if (event.button !== 0 || !this.ui) return;
    if ((event.target as HTMLElement).closest("#editor-root")) return;

    const point = this.raycastGround(event);
    const entity = this.raycastEntity(event);

    if (this.activeItem?.surfaceTool && point) {
      this.painting = true;
      this.controls.enabled = false;
      this.paintAt(point, this.activeItem.surfaceTool, event.altKey || this.eraseMode);
      return;
    }

    if (this.activeItem && point) {
      await this.placeEntity(point);
      return;
    }

    if (entity) {
      this.selectEntity(entity.userData.entityId as string);
      this.dragging = true;
      this.controls.enabled = false;
      return;
    }

    this.selectEntity(null);
  }
  private async onPointerMove(event: PointerEvent): Promise<void> {
    const point = this.raycastGround(event);
    this.updateHover(point);

    if (this.painting && point && this.activeItem?.surfaceTool) {
      this.paintAt(point, this.activeItem.surfaceTool, event.altKey || this.eraseMode);
      return;
    }

    if (!this.dragging || !point || !this.selectedEntityId) return;
    const entity = this.level.entities.find((item) => item.id === this.selectedEntityId);
    if (!entity) return;

    const snapped = entity.snap === "grid" ? snapPoint(point, this.level.metadata.size) : point;
    entity.position.x = snapped.x;
    entity.position.z = snapped.z;
    this.mapScene.setEntityTransform(entity);
    this.ui?.renderSelection(entity);
  }
  private onPointerUp(): void {
    if (this.dragging) void this.commitDraggedEntity();
    this.dragging = false;
    this.painting = false;
    this.lastPaintKey = null;
    this.controls.enabled = true;
  }
  private async onKeyDown(event: KeyboardEvent): Promise<void> {
    if ((event.target as HTMLElement).closest("input, select")) return;
    if (!this.selectedEntityId) {
      if (event.code === "Escape") { this.activeItem = null; this.placementPreview.setItem(null); }
      return;
    }

    if (event.code === "Delete" || event.code === "Backspace") {
      event.preventDefault();
      this.level.entities = this.level.entities.filter((entity) => entity.id !== this.selectedEntityId);
      this.mapScene.removeEntity(this.selectedEntityId);
      this.selectEntity(null);
      return;
    }

    if (event.code === "Escape") {
      this.selectEntity(null);
      return;
    }

    if (event.code === "KeyR") {
      const entity = this.level.entities.find((item) => item.id === this.selectedEntityId);
      if (!entity) return;
      const step = entity.kind === "prefab" || entity.kind === "kenney-piece" ? Math.PI / 2 : Math.PI / 4;
      entity.rotationY += event.shiftKey ? -step : step;
      await this.mapScene.upsertEntity(entity, false);
      this.ui?.renderSelection(entity);
    }
  }
  private async placeEntity(point: THREE.Vector3): Promise<void> {
    if (!this.activeItem || !this.ui) return;
    const next = createEntityFromPaletteItem(this.activeItem, point, this.level.metadata.size);
    this.level.entities.push(next);
    await this.mapScene.addEntity(next);
    this.selectEntity(next.id);
  }
  private async updateSelected(field: string, value: string): Promise<void> {
    if (!this.selectedEntityId) return;
    const entity = this.level.entities.find((item) => item.id === this.selectedEntityId);
    if (!entity) return;
    if (field !== "name" && field !== "snap" && !Number.isFinite(Number(value))) return;

    setEntityField(entity, field, value);
    const rebuild = field === "scale";
    await this.mapScene.upsertEntity(entity, rebuild);
    this.ui?.renderSelection(entity);
  }
  private updateSurfaceSetting(surface: "path" | "water", field: SurfaceSettingField, value: number): void {
    const next: LevelSurfaceSettings = normalizeSurfaceSettings({ ...this.level.surfaceSettings, [surface]: { ...this.level.surfaceSettings[surface], [field]: value } });
    this.level.surfaceSettings = next;
    this.mapScene.updateSurfaceSettings(next);
    this.ui?.renderLookSettings(this.level.grassColor, this.level.surfaceSettings);
  }
  private paintAt(point: THREE.Vector3, tool: SurfaceTool, erase: boolean): void {
    const cell = worldToCell(point.x, point.z, this.level.metadata.size);
    if (!cell) return;
    const key = `${tool}:${cellKey(cell)}:${erase ? "0" : "1"}`;
    if (this.lastPaintKey === key) return;
    this.lastPaintKey = key;
    const nextFilled = !erase;
    if (getCell(this.level.surfaceLayers[tool], cell) === nextFilled) return;
    this.level.surfaceLayers[tool] = setCell(this.level.surfaceLayers[tool], cell, nextFilled);
    this.mapScene.updateSurfaceCell(tool, cell, nextFilled);
  }
  private selectEntity(id: string | null): void {
    this.selectedEntityId = id;
    const entity = this.level.entities.find((item) => item.id === id) ?? null;
    this.ui?.renderSelection(entity);
    this.refreshSelectionBox();
  }
  private refreshSelectionBox(): void {
    const object = this.selectedEntityId ? this.mapScene.getEntityObject(this.selectedEntityId) : null;
    this.selectionBox.visible = !!object;
    if (object) this.selectionBox.setFromObject(object);
  }
  private updateHover(point: THREE.Vector3 | null): void { this.placementPreview.update(point); }
  private raycastGround(event: PointerEvent): THREE.Vector3 | null {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObject(this.mapScene.getGround())[0];
    return hit ? hit.point : null;
  }
  private raycastEntity(event: PointerEvent): THREE.Object3D | null {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObjects(this.mapScene.getEntityObjects(), true)[0];
    let current = hit?.object ?? null;
    while (current && !current.userData.entityId) current = current.parent;
    return current;
  }
  private updateMouse(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  private async commitDraggedEntity(): Promise<void> {
    if (!this.selectedEntityId) return;
    const entity = this.level.entities.find((item) => item.id === this.selectedEntityId);
    if (entity) await this.mapScene.upsertEntity(entity, false);
  }
}
