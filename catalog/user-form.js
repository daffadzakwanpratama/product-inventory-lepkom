import { LitElement, html, css } from "/lit-core.min.js";

class UserForm extends LitElement {
  static properties = {
    user: { type: Object },
  };

  constructor() {
    super();
    this.user = { username: "", password: "" };
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 30px;
      width: 100%;
      max-width: 450px;
      color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      transform: translateY(20px);
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes slideUp {
      to {
        transform: translateY(0);
      }
    }

    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 1.5rem;
      color: #f8fafc;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #cbd5e1;
      font-family: "Plus Jakarta Sans", sans-serif;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: white;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.1);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
    }

    button {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .btn-save {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-save:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
  `;

  handleInput(e) {
    const { name, value } = e.target;
    this.user = { ...this.user, [name]: value };
  }

  async save() {
    if (!this.user.username || !this.user.password) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Harap isi semua kolom!", type: "warning" },
        }),
      );
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(this.user),
      });

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Pengguna baru berhasil ditambahkan!",
              type: "success",
            },
          }),
        );
        this.dispatchEvent(new CustomEvent("saved"));
      } else {
        const err = await response.json().catch(() => ({}));
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: err.error || "Gagal menambahkan pengguna.",
              type: "error",
            },
          }),
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Terjadi kesalahan jaringan.", type: "error" },
        }),
      );
    }
  }

  close() {
    this.dispatchEvent(new CustomEvent("closed"));
  }

  render() {
    return html`
      <div class="modal-overlay" @click="${this.close}">
        <div class="modal-content" @click="${(e) => e.stopPropagation()}">
          <h3>Tambah Pengguna Baru</h3>
          <div class="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              .value="${this.user.username}"
              @input="${this.handleInput}"
              placeholder="Masukkan username"
            />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              .value="${this.user.password}"
              @input="${this.handleInput}"
              placeholder="Masukkan password"
            />
          </div>
          <div class="actions">
            <button class="btn-cancel" @click="${this.close}">Batal</button>
            <button class="btn-save" @click="${this.save}">
              Simpan Pengguna
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("user-form", UserForm);
