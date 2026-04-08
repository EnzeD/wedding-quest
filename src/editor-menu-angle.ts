export function mountStartAngleButton(label: string, onClick: () => void): void {
  const toolbar = document.querySelector("#editor-root .editor-toolbar");
  if (!(toolbar instanceof HTMLDivElement)) return;
  if (toolbar.querySelector("[data-editor-start-angle='1']")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-btn";
  button.dataset.editorStartAngle = "1";
  button.textContent = label;
  button.addEventListener("click", onClick);
  toolbar.appendChild(button);
}
