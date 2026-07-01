import { LitElement, html, css } from "/lit-core.min.js";

class TransactionForm extends LitElement {
  static properties = {
    product: { type: Object },
    transactionType: { type: String },
    quantity: { type: Number },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.product = { id: 0, name: "", stock: 0 };
    this.transactionType = "IN";
    this.quantity = 1;
    this.errorMessage = "";
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .overlay {
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
      z-index: 1000;
    }
    .modal {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 25px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      color: white;
      font-family: "Plus Jakarta Sans", sans-serif;
    }
    h3 {
      margin-top: 0;
      margin-bottom: 5px;
      font-size: 1.3rem;
    }
    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 0.95rem;
      font-weight: 500;
      color: #e2e8f0;
    }
    select,
    input[type="number"] {
      width: 100%;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.25);
      color: white;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    select:focus,
    input[type="number"]:focus {
      outline: none;
      border-color: #3b82f6;
    }
    option {
      background: #1e293b;
      color: white;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 25px;
      justify-content: flex-end;
    }
    button {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: "Plus Jakarta Sans", sans-serif;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    .error {
      color: #fda4af;
      font-size: 0.85rem;
      margin-bottom: 15px;
    }
  `;

  handleTypeChange(e) {
    this.transactionType = e.target.value;
  }

  handleQuantityChange(e) {
    this.quantity = parseInt(e.target.value) || 0;
  }

  async save() {
    if (this.quantity <= 0) {
      this.errorMessage = "Jumlah kuantitas harus lebih dari 0";
      return;
    }

    if (this.transactionType === "OUT" && this.quantity > this.product.stock) {
      this.errorMessage = "Stok barang tidak mencukupi untuk transaksi OUT";
      return;
    }

    this.errorMessage = "";
    const token = localStorage.getItem("token");

    const payload = {
      product_id: this.product.id,
      transaction_type: this.transactionType,
      quantity: this.quantity,
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Transaksi stok berhasil dicatat!",
              type: "success",
            },
          }),
        );
        this.dispatchEvent(new CustomEvent("saved"));
      } else {
        const data = await response.json();
        this.errorMessage = data.error || "Gagal mencatat transaksi";
      }
    } catch (error) {
      this.errorMessage = "Kesalahan jaringan";
    }
  }

  close() {
    this.dispatchEvent(new CustomEvent("closed"));
  }

  render() {
    return html`
      <div class="overlay" @click="${this.close}">
        <div class="modal" @click="${(e) => e.stopPropagation()}">
          <h3>Mutasi Stok Produk</h3>
          <p
            style="font-size: 0.9rem; color: #94a3b8; margin-top: 0; margin-bottom: 20px; line-height: 1.4;"
          >
            <span style="font-size: 0.85rem; opacity: 0.8;"
              >(Stok Saat Ini: ${this.product.stock})</span
            >
          </p>

          ${this.errorMessage
            ? html`<div class="error">${this.errorMessage}</div>`
            : ""}

          <div class="form-group">
            <label>Tipe Transaksi</label>
            <select
              .value="${this.transactionType}"
              @change="${this.handleTypeChange}"
            >
              <option value="IN">Masuk (IN) - Menambah Stok</option>
              <option value="OUT">Keluar (OUT) - Mengurangi Stok</option>
            </select>
          </div>

          <div class="form-group">
            <label>Kuantitas / Jumlah</label>
            <input
              type="number"
              min="1"
              .value="${this.quantity}"
              @input="${this.handleQuantityChange}"
            />
          </div>

          <div class="actions">
            <button class="btn-secondary" @click="${this.close}">Batal</button>
            <button class="btn-primary" @click="${this.save}">
              Simpan Transaksi
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("transaction-form", TransactionForm);
