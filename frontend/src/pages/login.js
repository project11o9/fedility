document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const data = await AuthService.login({ email, password });
      AuthService.setSession(data);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert(error.message || "Login failed");
    }
  });
});
