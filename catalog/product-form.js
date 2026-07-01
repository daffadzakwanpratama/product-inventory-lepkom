import { LitElement, html, css } from "/lit-core.min.js";

class ProductForm extends LitElement {
  static properties = {
    product: { type: Object },
    isEdit: { type: Boolean },
  };

  constructor() {
    super();
    this.product = { name: "", stock: 0, price: 0 };
    this.isEdit = false;
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .modal {
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
    .modal-content {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 30px;
      width: 100%;
      max-width: 450px;
      color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    h2 {
      margin-bottom: 20px;
      font-weight: 600;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
    input {
      width: 100%;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: white;
      font-family: inherit;
    }
    input:focus {
      outline: none;
      border-color: #818cf8;
    }
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 25px;
    }
    button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
    }
    .btn-save {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  `;

  handleInput(e) {
    const { name, value, type } = e.target;
    this.product = {
      ...this.product,
      [name]: type === "number" ? parseFloat(value) : value,
    };
  }

  async save() {
    const method = this.isEdit ? "PUT" : "POST";
    const url = this.isEdit
      ? `/api/products/${this.product.id}`
      : "/api/products";
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.product),
    });

    if (response.ok) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Produk berhasil disimpan!", type: "success" },
        }),
      );
      this.dispatchEvent(new CustomEvent("saved", { detail: this.product }));
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Gagal menyimpan produk.", type: "error" },
        }),
      );
    }
  }

  cancel() {
    this.dispatchEvent(new CustomEvent("closed"));
  }

  render() {
    return html`
      <div class="modal">
        <div class="modal-content">
          <h2>${this.isEdit ? "Edit Produk" : "Tambah Produk Baru"}</h2>

          <div class="form-group">
            <label>Nama Produk</label>
            <input
              type="text"
              name="name"
              .value="${this.product.name}"
              @input="${this.handleInput}"
            />
          </div>

          <div class="form-group">
            <label>Stok Barang</label>
            <input
              type="number"
              name="stock"
              .value="${this.product.stock}"
              @input="${this.handleInput}"
            />
          </div>

          <div class="form-group">
            <label>Harga (Rp)</label>
            <input
              type="number"
              name="price"
              .value="${this.product.price}"
              @input="${this.handleInput}"
            />
          </div>

          <div class="btn-group">
            <button class="btn-cancel" @click="${this.cancel}">Batal</button>
            <button class="btn-save" @click="${this.save}">Simpan</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("product-form", ProductForm);
