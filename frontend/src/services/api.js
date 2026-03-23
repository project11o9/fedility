(function initApi(global) {
  function resolveBaseUrl() {
    const explicit = global.__APP_CONFIG__?.BASE_URL || global.localStorage?.getItem("API_BASE_URL");
    if (explicit) return explicit.replace(/\/$/, "");

    const host = global.location.hostname;
    if (global.location.protocol === "file:" || !host) return "http://localhost:3001";
    if (host === "localhost" || host === "127.0.0.1") return `${global.location.protocol}//${host}:3001`;
    if (host.endsWith("github.io")) return "https://fidelity-trading-app.onrender.com";
    return global.location.origin;
  }

  const BASE_URL = resolveBaseUrl();

  async function request(path, options = {}) {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_error) {
      data = null;
    }

    if (!response.ok) {
      const message = data?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  global.AppApi = {
    BASE_URL,
    getBaseUrl: () => BASE_URL,
    request
  };
})(window);
