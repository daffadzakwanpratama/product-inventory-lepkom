import { LitElement, html, css } from "/lit-core.min.js";

class ConfirmModal extends LitElement {
  static properties = {
    isOpen: { type: Boolean },
    message: { type: String },
    resolvePromise: { type: Object },
  };

  constructor() {
    super();
    this.isOpen = false;
    this.message = "";
    this.resolvePromise = null;

    window.addEventListener("show-confirm", (e) => {
      this.message = e.detail.message;
      this.resolvePromise = e.detail.resolve;
      this.isOpen = true;
    });
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
      z-index: 10000;
      opacity: 0;
      animation: fadeIn 0.2s forwards;
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 25px 30px;
      width: 100%;
      max-width: 400px;
      color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      font-family: "Plus Jakarta Sans", sans-serif;
      text-align: center;
      transform: translateY(20px);
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes slideUp {
      to {
        transform: translateY(0);
      }
    }

    .icon-warning {
      color: #f59e0b;
      font-size: 3rem;
      margin-bottom: 15px;
      line-height: 1;
    }

    .message {
      font-size: 1.1rem;
      margin-bottom: 25px;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    button {
      padding: 10px 24px;
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
      transform: translateY(-2px);
    }

    .btn-confirm {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
    .btn-confirm:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }
  `;

  handleConfirm() {
    if (this.resolvePromise) this.resolvePromise(true);
    this.close();
  }

  handleCancel() {
    if (this.resolvePromise) this.resolvePromise(false);
    this.close();
  }

  close() {
    this.isOpen = false;
    this.message = "";
    this.resolvePromise = null;
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="icon-warning">⚠️</div>
          <div class="message">${this.message}</div>
          <div class="actions">
            <button class="btn-cancel" @click="${this.handleCancel}">
              Batal
            </button>
            <button class="btn-confirm" @click="${this.handleConfirm}">
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("confirm-modal", ConfirmModal);

export const showConfirm = (message) => {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent("show-confirm", {
        detail: { message, resolve },
      }),
    );
  });
};
