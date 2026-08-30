(function initMarufiaCharacterConflicts(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTER_CONFLICTS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root.MARUFIA_CHARACTER_SYNC, root.LATIO_STATE));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCharacterConflictsApi(root) {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function originLabel(origin) {
    return ({ player: "Jogador", gm: "Mæstre", system: "Sistema" })[String(origin ?? "")] ?? "Origem não identificada";
  }

  function timestampLabel(value) {
    const date = new Date(String(value ?? ""));
    return Number.isNaN(date.getTime()) ? "Horário não disponível" : date.toLocaleString("pt-BR");
  }

  function conflictDialogHtml(conflict = {}) {
    const remote = conflict.remote;
    const local = conflict.local;
    const localName = String(local?.character?.name ?? "").trim() || "Personagem sem nome";
    const remoteName = String(remote?.name ?? remote?.state?.character?.name ?? "").trim() || "Personagem sem nome";
    const remoteDetails = remote
      ? `<div class="card character-conflict-version"><span class="muted small">Versão online</span><strong>${escapeHtml(remoteName)}</strong><span>Revisão ${escapeHtml(remote.revision)}</span><span>${escapeHtml(originLabel(remote.last_change_origin))} · ${escapeHtml(timestampLabel(remote.updated_at))}</span></div>`
      : `<div class="card character-conflict-version"><span class="muted small">Versão online</span><strong>Não foi possível carregar os detalhes agora.</strong></div>`;
    return `<div class="character-conflict-dialog stack" data-online-character-conflict-modal>
      <p>A ficha foi alterada online depois da última versão conhecida neste computador. Nenhuma das duas versões foi sobrescrita.</p>
      <div class="grid two">
        <div class="card character-conflict-version"><span class="muted small">Versão deste computador</span><strong>${escapeHtml(localName)}</strong><span>${escapeHtml(timestampLabel(local?.meta?.updatedAt))}</span></div>
        ${remoteDetails}
      </div>
      <p class="muted small">Escolha <strong>Manter minha versão</strong> apenas se deseja substituir conscientemente a versão online. Você também pode baixar a versão online antes de decidir.</p>
    </div>`;
  }

  function safeFileName(value) {
    return String(value ?? "personagem").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "personagem";
  }

  function downloadRemoteVersion(view, document, conflict, stateTools = root?.LATIO_STATE) {
    const state = conflict?.remote?.state;
    if (!state || typeof view?.Blob !== "function" || typeof view?.URL?.createObjectURL !== "function") return false;
    const payload = typeof stateTools?.createOnlineBackup === "function"
      ? stateTools.createOnlineBackup(state, conflict.remote, new Date().toISOString())
      : state;
    const url = view.URL.createObjectURL(new view.Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(conflict.remote.name)}-versao-online.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    view.URL.revokeObjectURL(url);
    return true;
  }

  function init(document, syncTools, stateTools = root?.LATIO_STATE) {
    const modalRoot = document.querySelector("#modalRoot");
    if (!modalRoot || !syncTools || modalRoot.dataset.characterConflictsInitialized === "true") return null;
    modalRoot.dataset.characterConflictsInitialized = "true";
    const view = document.defaultView ?? root ?? globalThis;
    const conflictEvent = syncTools.CHARACTER_CONFLICT_EVENT ?? "marufia:character-conflict";
    const resolutionEvent = syncTools.CHARACTER_CONFLICT_RESOLUTION_EVENT ?? "marufia:character-conflict-resolved";
    let pending = null;

    function renderConflict() {
      if (!pending) return;
      const body = conflictDialogHtml(pending);
      const footer = `<button class="button" type="button" data-online-character-conflict-action="keep-local" ${pending.remote ? "" : "disabled"}>Manter minha versão</button><button class="ghost" type="button" data-online-character-conflict-action="download-online" ${pending.remote ? "" : "disabled"}>Baixar versão online</button><button class="ghost" type="button" data-online-character-conflict-action="later">Decidir depois</button>`;
      if (typeof view.openModal === "function") view.openModal("Conflito de sincronização", body, footer);
      else modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Conflito de sincronização"><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
    }

    function closeConflict() {
      if (typeof view.closeModal === "function") view.closeModal();
      else modalRoot.innerHTML = "";
    }

    const receiveConflict = (event) => {
      pending = event?.detail ?? null;
      renderConflict();
    };
    const handleClick = (event) => {
      const control = event.target.closest?.("[data-online-character-conflict-action]");
      if (!control || !pending) return;
      const action = control.dataset.onlineCharacterConflictAction;
      if (action === "download-online") {
        downloadRemoteVersion(view, document, pending, stateTools);
        return;
      }
      if (action === "keep-local") {
        view.dispatchEvent?.(new view.CustomEvent(resolutionEvent, {
          detail: { choice: "local", characterId: String(pending.characterId ?? "") },
        }));
        pending = null;
      }
      closeConflict();
    };

    view.addEventListener?.(conflictEvent, receiveConflict);
    document.addEventListener("click", handleClick);

    return Object.freeze({
      pending: () => pending,
      renderConflict,
      destroy() {
        view.removeEventListener?.(conflictEvent, receiveConflict);
        document.removeEventListener?.("click", handleClick);
        delete modalRoot.dataset.characterConflictsInitialized;
      },
    });
  }

  return { escapeHtml, originLabel, conflictDialogHtml, downloadRemoteVersion, init };
});
