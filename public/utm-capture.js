/* First-touch sc_utm cookie. Keep in step with src/lib/auth/utm-capture.ts. */
(function () {
  var NAME = "sc_utm";
  var MAX = 200;
  var MAX_AGE = 60 * 60 * 24 * 30;

  function hasCookie() {
    var parts = document.cookie ? document.cookie.split(";") : [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].replace(/^\s+/, "").indexOf(NAME + "=") === 0) return true;
    }
    return false;
  }

  function clip(value) {
    if (value == null) return null;
    var trimmed = String(value).replace(/^\s+|\s+$/g, "");
    if (!trimmed) return null;
    return trimmed.slice(0, MAX);
  }

  if (hasCookie()) return;

  var params = new URLSearchParams(window.location.search);
  var hasUtm = false;
  params.forEach(function (_value, key) {
    if (key.indexOf("utm_") === 0) hasUtm = true;
  });
  if (!hasUtm) return;

  var payload = {
    utm_source: clip(params.get("utm_source")),
    utm_medium: clip(params.get("utm_medium")),
    utm_campaign: clip(params.get("utm_campaign")),
    utm_content: clip(params.get("utm_content")),
    landing_path: clip(window.location.pathname) || "/",
  };

  document.cookie =
    NAME +
    "=" +
    encodeURIComponent(JSON.stringify(payload)) +
    "; Max-Age=" +
    MAX_AGE +
    "; Path=/; SameSite=Lax";
})();
