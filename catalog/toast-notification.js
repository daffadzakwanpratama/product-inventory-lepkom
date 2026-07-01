import { LitElement, html, css } from "/lit-core.min.js";

class ToastNotification extends LitElement {
  static properties = {
    toastQueue: { type: Array },
  };

  constructor() {
    super();
    this.toastQueue = [];

    window.addEventListener("show-toast", (e) => {
      this.addToast(e.detail.message, e.detail.type || "info");
    });
  }

  addToast(message, type) {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const toast = { id, message, type };

    this.toastQueue = [...this.toastQueue, toast];

    setTimeout(() => {
      this.removeToast(id);
    }, 3500);
  }

  removeToast(id) {
    this.toastQueue = this.toastQueue.filter((t) => t.id !== id);
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      min-width: 250px;
      max-width: 350px;
      padding: 16px 20px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: white;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
      animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      border-left: 4px solid transparent;
    }

    @keyframes slideIn {
      from {
        transform: translateX(120%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.success {
      border-left-color: #10b981;
    }
    .toast.error {
      border-left-color: #ef4444;
    }
    .toast.info {
      border-left-color: #3b82f6;
    }
    .toast.warning {
      border-left-color: #f59e0b;
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0 0 0 15px;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: white;
    }
  `;

  render() {
    return html`
      <div class="toast-container">
        ${this.toastQueue.map(
          (t) => html`
            <div class="toast ${t.type}">
              <span>${t.message}</span>
              <button
                class="close-btn"
                @click="${() => this.removeToast(t.id)}"
              >
                &times;
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }
}

customElements.define("toast-notification", ToastNotification);

export const showToast = (message, type = "info") => {
  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: { message, type },
    }),
  );
};
