(function setupTranslyYouTubePageBridge() {
  const REQUEST_TYPE = "TRANSLY_READ_YOUTUBE_PLAYER_RESPONSE";
  const RESPONSE_TYPE = "TRANSLY_YOUTUBE_PLAYER_RESPONSE";

  function parseMaybeJson(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch (error) {
      return null;
    }
  }

  function readPlayerResponse() {
    const candidates = [
      window.ytInitialPlayerResponse,
      window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.raw_player_response,
      window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.player_response,
      window.ytcfg && typeof window.ytcfg.get === "function" && window.ytcfg.get("PLAYER_RESPONSE"),
      window.ytcfg && typeof window.ytcfg.get === "function" && window.ytcfg.get("PLAYER_VARS") && window.ytcfg.get("PLAYER_VARS").player_response
    ];
    for (const candidate of candidates) {
      const parsed = parseMaybeJson(candidate);
      const tracks = parsed && parsed.captions && parsed.captions.playerCaptionsTracklistRenderer && parsed.captions.playerCaptionsTracklistRenderer.captionTracks;
      if (Array.isArray(tracks) && tracks.length) return parsed;
    }
    return null;
  }

  function compactPlayerResponse(response) {
    const renderer = response && response.captions && response.captions.playerCaptionsTracklistRenderer;
    return {
      videoDetails: {
        videoId: response && response.videoDetails && response.videoDetails.videoId
      },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: Array.isArray(renderer && renderer.captionTracks) ? renderer.captionTracks : []
        }
      }
    };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.type !== REQUEST_TYPE) return;
    const response = readPlayerResponse();
    window.postMessage({
      type: RESPONSE_TYPE,
      requestId: event.data.requestId,
      ok: Boolean(response),
      response: response ? compactPlayerResponse(response) : null,
      href: window.location.href
    }, window.location.origin || "*");
  });
})();
