import { LitElement, html, css } from "/lit-core.min.js";

class LoginForm extends LitElement {
  static properties = {
    credentials: { type: Object },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.credentials = { username: "", password: "" };
    this.errorMessage = "";
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .login-container {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      text-align: center;
      color: white;
    }
    h2 {
      margin-bottom: 30px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    input {
      width: 100%;
      padding: 14px 16px;
      margin: 10px 0;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: white;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    input:focus {
      outline: none;
      border-color: #818cf8;
      background: rgba(0, 0, 0, 0.4);
      box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.2);
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 1rem;
      margin-top: 15px;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    .error {
      color: #fda4af;
      background: rgba(225, 29, 72, 0.2);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      border: 1px solid rgba(225, 29, 72, 0.3);
    }
  `;

  handleInput(e) {
    const { name, value } = e.target;
    this.credentials = { ...this.credentials, [name]: value };
  }

  async handleLogin(e) {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.api_token) {
          localStorage.setItem("api_token", data.api_token);
        }
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Login berhasil!", type: "success" },
          }),
        );
        window.dispatchEvent(new CustomEvent("login-success"));
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.errorMessage =
          errorData.error || "Login gagal. Periksa kembali kredensial Anda.";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: this.errorMessage, type: "error" },
          }),
        );
      }
    } catch (error) {
      this.errorMessage = "Terjadi kesalahan jaringan. Pastikan server nyala.";
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: this.errorMessage, type: "error" },
        }),
      );
    } finally {
    }
  }

  render() {
    return html`
      <div class="login-wrapper">
        <div class="login-container">
          <h2>Inventory System</h2>
          ${this.errorMessage
            ? html`<div class="error">${this.errorMessage}</div>`
            : ""}
          <form @submit="${this.handleLogin}">
            <input
              type="text"
              name="username"
              placeholder="Username"
              @input="${this.handleInput}"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              @input="${this.handleInput}"
              required
            />
            <button type="submit">Log In</button>
          </form>
        </div>
      </div>
    `;
  }
}

customElements.define("login-form", LoginForm);
