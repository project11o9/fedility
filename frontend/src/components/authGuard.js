(function authGuard(global) {
  function parseJwt(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch (_error) {
      return null;
    }
  }

  function requireAuth(options = { role: null }) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return null;
    }

    const user = parseJwt(token);
    if (!user || !user.exp || user.exp <= Math.floor(Date.now() / 1000)) {
      localStorage.clear();
      window.location.href = "login.html";
      return null;
    }

    if (options.role && user.role !== options.role) {
      alert("Access denied");
      window.location.href = "dashboard.html";
      return null;
    }

    return { token, user };
  }

  global.AuthGuard = { requireAuth };
})(window);
