(function initMarufiaCharacterRealtime(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTER_REALTIME = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCharacterRealtimeApi(root) {
  "use strict";

  const REALTIME_ERROR_STATES = Object.freeze(["CHANNEL_ERROR", "TIMED_OUT"]);
  let channelSerial = 0;

  function realtimeError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeUuid(value, label) {
    const id = String(value ?? "").trim().toLowerCase();
    const pattern = root?.MARUFIA_CHARACTERS?.UUID_PATTERN
      ?? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!pattern.test(id)) throw realtimeError("LAT-REALTIME-ID-001", `${label} inválido.`);
    return id;
  }

  function normalizedRealtimeChange(payload, characterTools, scope) {
    if (payload?.eventType !== "UPDATE" || payload?.schema !== "public" || payload?.table !== "characters") {
      throw realtimeError("LAT-REALTIME-PAYLOAD-001", "O evento remoto do personagem é inválido.");
    }
    const character = characterTools?.normalizedCharacter?.(payload.new);
    if (!character) throw realtimeError("LAT-REALTIME-PAYLOAD-002", "O personagem remoto recebido é inválido.");
    const expected = normalizeUuid(scope.id, scope.kind === "campaign" ? "Campanha" : "Personagem");
    if (scope.kind === "character" && character.id !== expected) {
      throw realtimeError("LAT-REALTIME-SCOPE-001", "O evento pertence a outro personagem.");
    }
    if (scope.kind === "campaign" && character.campaign_id !== expected) {
      throw realtimeError("LAT-REALTIME-SCOPE-002", "O evento pertence a outra campanha.");
    }
    return Object.freeze({
      event: "UPDATE",
      commitTimestamp: String(payload.commit_timestamp ?? ""),
      character,
    });
  }

  function createCharacterRealtimeService(client, characterTools = root?.MARUFIA_CHARACTERS) {
    if (typeof client?.channel !== "function" || typeof client?.removeChannel !== "function"
      || typeof characterTools?.normalizedCharacter !== "function") {
      throw realtimeError("LAT-REALTIME-CLIENT-001", "O serviço em tempo real não está disponível.");
    }

    function subscribe(scope, onChange, onStatus = () => {}) {
      if (typeof onChange !== "function") throw realtimeError("LAT-REALTIME-LISTENER-001", "O destino do evento remoto é inválido.");
      const kind = scope?.kind === "campaign" ? "campaign" : "character";
      const id = normalizeUuid(scope?.id, kind === "campaign" ? "Campanha" : "Personagem");
      const column = kind === "campaign" ? "campaign_id" : "id";
      const safeStatus = (status, error = null) => {
        try {
          onStatus(String(status ?? ""), error);
        } catch {
          // Observadores opcionais não podem interromper o canal.
        }
      };
      const channel = client
        .channel(`marufia-character-${kind}-${id}-${++channelSerial}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "characters",
          filter: `${column}=eq.${id}`,
        }, (payload) => {
          try {
            onChange(normalizedRealtimeChange(payload, characterTools, { kind, id }));
          } catch (error) {
            safeStatus("INVALID_PAYLOAD", error);
          }
        })
        .subscribe((status, error) => safeStatus(status, error));
      let closed = false;

      return Object.freeze({
        channel,
        id,
        scope: kind,
        async unsubscribe() {
          if (closed) return "ok";
          closed = true;
          return client.removeChannel(channel);
        },
      });
    }

    return Object.freeze({
      subscribeToCharacter(characterId, onChange, onStatus) {
        return subscribe({ kind: "character", id: characterId }, onChange, onStatus);
      },
      subscribeToCampaign(campaignId, onChange, onStatus) {
        return subscribe({ kind: "campaign", id: campaignId }, onChange, onStatus);
      },
    });
  }

  return {
    REALTIME_ERROR_STATES,
    normalizedRealtimeChange,
    createCharacterRealtimeService,
  };
});
