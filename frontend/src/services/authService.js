(function initAuthService(global) {
  const getToken = () => global.localStorage.getItem("token");

  function setSession(payload) {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("username", payload.user?.name || "");
    localStorage.setItem("userRole", payload.user?.role || "user");
  }

  function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
  }

  async function login(credentials) {
    return global.AppApi.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  }

  async function signup(payload) {
    return global.AppApi.request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  global.AuthService = {
    getToken,
    setSession,
    clearSession,
    login,
    signup
  };
})(window);
