import { LitElement, html, css } from "/lit-core.min.js";
import "/product-form.js";
import "/user-form.js";
import "/transaction-form.js";
import { showConfirm } from "/confirm-modal.js";

class ProductList extends LitElement {
  static properties = {
    products: { type: Array },
    users: { type: Array },
    transactions: { type: Array },
    errorMessage: { type: String },
    apiToken: { type: String },
    role: { type: String },
    showForm: { type: Boolean },
    showUserForm: { type: Boolean },
    showTransactionForm: { type: Boolean },
    editingProduct: { type: Object },
    mutatingProduct: { type: Object },
    activeTab: { type: String },
    showTokenModal: { type: Boolean },
    modalTokenValue: { type: String },
    modalTokenUser: { type: String },
  };

  constructor() {
    super();
    this.products = [];
    this.users = [];
    this.errorMessage = "";
    this.apiToken = localStorage.getItem("api_token") || "";
    this.role = localStorage.getItem("role") || "user";
    this.showForm = false;
    this.showUserForm = false;
    this.showTransactionForm = false;
    this.editingProduct = null;
    this.mutatingProduct = null;
    this.activeTab = "products";
    this.showTokenModal = false;
    this.modalTokenValue = "";
    this.modalTokenUser = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchProducts();
    if (this.role === "admin") {
      this.fetchUsers();
    }
    this.fetchTransactions();
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .container {
      max-width: 1000px;
      margin: 40px auto;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      color: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    h2 {
      margin: 0;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .actions-bar {
      display: flex;
      gap: 15px;
    }

    .tabs {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }
    .tab {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 8px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      transition: all 0.2s;
    }
    .tab:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .tab.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-danger {
      background: rgba(220, 38, 38, 0.8);
      color: white;
    }
    .btn-danger:hover {
      background: rgba(220, 38, 38, 1);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .btn-small {
      padding: 4px 10px;
      font-size: 0.8rem;
    }

    .api-token-display {
      font-family: monospace;
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 12px;
      border-radius: 6px;
      word-break: break-all;
      margin-top: 10px;
      color: #a7f3d0;
      font-size: 0.85rem;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 10px;
      border-radius: 8px;
      overflow: hidden;
    }
    th,
    td {
      text-align: left;
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    th {
      background-color: rgba(255, 255, 255, 0.1);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }
    tr:hover td {
      background-color: rgba(255, 255, 255, 0.05);
    }
    .error {
      color: #fda4af;
    }

    .action-td {
      white-space: nowrap;
    }
    .action-td button {
      margin-right: 8px;
    }
    .action-td button:last-child {
      margin-right: 0;
    }
    .btn-icon {
      padding: 6px 12px;
      font-size: 0.85rem;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-admin {
      background: rgba(99, 102, 241, 0.3);
      color: #c7d2fe;
    }
    .badge-user {
      background: rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
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
      z-index: 1000;
    }
    .modal-content {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 25px;
      width: 100%;
      max-width: 500px;
      color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .modal-content h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }
  `;

  async fetchProducts() {
    const token = localStorage.getItem("token");
    if (!token) return this.logout();

    try {
      const response = await fetch("/api/products", {
        headers: { Authorization: "Bearer " + token },
      });

      if (response.ok) {
        this.products = await response.json();
      } else if (response.status === 401) {
        this.logout();
      } else {
        this.errorMessage = "Gagal mengambil data produk.";
      }
    } catch (error) {
      this.errorMessage = "Terjadi kesalahan jaringan.";
    }
  }

  async fetchUsers() {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        this.users = await response.json();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async fetchTransactions() {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        this.transactions = await response.json();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async generateUserToken(userId, username) {
    const confirmed = await showConfirm(
      "Generate API token baru untuk " + username + "?",
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/users/" + userId + "/token", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        const data = await response.json();
        this.apiToken = data.api_token;
        localStorage.setItem("api_token", data.api_token);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "API Token baru berhasil di-generate untuk " + username,
              type: "success",
            },
          }),
        );
        this.fetchUsers();
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Gagal me-generate API Token user",
              type: "error",
            },
          }),
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Kesalahan jaringan", type: "error" },
        }),
      );
    }
  }

  async deleteProduct(id) {
    const confirmed = await showConfirm("Yakin ingin menghapus produk ini?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/products/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Produk berhasil dihapus!", type: "success" },
          }),
        );
        this.fetchProducts();
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Gagal menghapus produk", type: "error" },
          }),
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Kesalahan jaringan", type: "error" },
        }),
      );
    }
  }

  async deleteUser(id, username) {
    const confirmed = await showConfirm(
      "Yakin ingin menghapus user " + username + "?",
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/users/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "User berhasil dihapus!", type: "success" },
          }),
        );
        this.fetchUsers();
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Gagal menghapus user", type: "error" },
          }),
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Kesalahan jaringan", type: "error" },
        }),
      );
    }
  }

  openAddForm() {
    this.editingProduct = null;
    this.showForm = true;
  }

  openEditForm(product) {
    this.editingProduct = { ...product };
    this.showForm = true;
  }

  openMutasiForm(product) {
    this.mutatingProduct = { ...product };
    this.showTransactionForm = true;
  }

  onMutasiFormSaved() {
    this.showTransactionForm = false;
    this.fetchProducts();
    this.fetchTransactions();
  }

  onMutasiFormClosed() {
    this.showTransactionForm = false;
    this.mutatingProduct = null;
  }

  onFormClosed() {
    this.showForm = false;
    this.editingProduct = null;
  }

  onFormSaved() {
    this.showForm = false;
    this.editingProduct = null;
    this.fetchProducts();
  }

  openTokenModal(user, token) {
    this.modalTokenUser = user;
    this.modalTokenValue = token;
    this.showTokenModal = true;
  }

  closeTokenModal() {
    this.showTokenModal = false;
    this.modalTokenUser = "";
    this.modalTokenValue = "";
  }

  copyToken() {
    navigator.clipboard
      .writeText(this.modalTokenValue)
      .then(() => {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Token berhasil disalin!", type: "success" },
          }),
        );
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Gagal menyalin token", type: "error" },
          }),
        );
      });
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("api_token");
    window.dispatchEvent(new CustomEvent("logout"));
  }

  setTab(tab) {
    this.activeTab = tab;
  }

  openAddUserForm() {
    this.showUserForm = true;
  }

  onUserFormClosed() {
    this.showUserForm = false;
  }

  onUserFormSaved() {
    this.showUserForm = false;
    this.fetchUsers();
  }

  async generateOwnToken() {
    const confirmed = await showConfirm(
      "Generate API token baru untuk akun Anda?",
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/user/token", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        const data = await response.json();
        this.apiToken = data.api_token;
        localStorage.setItem("api_token", data.api_token);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "API Token berhasil dibuat!",
              type: "success",
            },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Gagal membuat Token", type: "error" },
          }),
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Kesalahan jaringan", type: "error" },
        }),
      );
    }
  }

  renderProductsTab() {
    return html`
      <div class="header" style="margin-top: 10px;">
        <h3>Daftar Produk</h3>
        <button class="btn-secondary" @click="${this.openAddForm}">
          + Tambah Produk
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Produk</th>
            <th>Stok</th>
            <th>Harga (Rp)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${this.products.map(
      (p, index) => html`
              <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.stock}</td>
                <td>${p.price.toLocaleString("id-ID")}</td>
                <td class="action-td">
                  <button
                    class="btn-secondary btn-icon"
                    @click="${() => this.openMutasiForm(p)}"
                  >
                    Mutasi
                  </button>
                  <button
                    class="btn-secondary btn-icon"
                    @click="${() => this.openEditForm(p)}"
                  >
                    Edit
                  </button>
                  <button
                    class="btn-secondary btn-icon"
                    @click="${() => this.deleteProduct(p.id)}"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            `,
    )}
          ${this.products.length === 0
        ? html`<tr>
                <td colspan="5" style="text-align:center; padding: 30px;">
                  Belum ada data produk
                </td>
              </tr>`
        : ""}
        </tbody>
      </table>
    `;
  }

  renderUsersTab() {
    return html`
      <div class="header" style="margin-top: 20px;">
        <h3>Manajemen Pengguna</h3>
        <button class="btn-secondary" @click="${this.openAddUserForm}">
          + Tambah Pengguna
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>API Token Aktif</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map(
      (u) => html`
              <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>
                  <span
                    class="badge ${u.role === "admin"
          ? "badge-admin"
          : "badge-user"}"
                    >${u.role}</span
                  >
                </td>
                <td style="max-width: 250px;">
                  ${u.api_token
          ? html`<button
                        class="btn-secondary btn-small"
                        @click="${() =>
              this.openTokenModal(u.username, u.api_token)}"
                      >
                        Lihat Token
                      </button>`
          : html`<span
                        style="color: rgba(255,255,255,0.4); font-size: 0.85rem;"
                        >Belum ada token</span
                      >`}
                </td>
                <td class="action-td" style="flex-wrap: wrap;">
                  <button
                    class="btn-secondary btn-small"
                    @click="${() => this.generateUserToken(u.id, u.username)}"
                  >
                    Generate Token
                  </button>
                  ${u.role !== "admin"
          ? html`<button
                        class="btn-secondary btn-small"
                        @click="${() => this.deleteUser(u.id, u.username)}"
                      >
                        Hapus
                      </button>`
          : ""}
                </td>
              </tr>
            `,
    )}
          ${this.users.length === 0
        ? html`<tr>
                <td colspan="5" style="text-align:center; padding: 30px;">
                  Belum ada data user
                </td>
              </tr>`
        : ""}
        </tbody>
      </table>
    `;
  }

  renderTransactionsTab() {
    return html`
      <div class="header" style="margin-top: 20px;">
        <h3>Riwayat Transaksi Stok</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tanggal</th>
            <th>Produk</th>
            <th>Tipe</th>
            <th>Qty</th>
            <th>User/Kasir</th>
          </tr>
        </thead>
        <tbody>
          ${(this.transactions || []).map(
      (t) => html`
              <tr>
                <td>#${t.id}</td>
                <td>${new Date(t.created_at).toLocaleString("id-ID")}</td>
                <td><strong style="color: #60a5fa">${t.product_name}</strong></td>
                <td>
                  <span class="badge ${t.transaction_type === 'IN' ? 'badge-user' : 'badge-admin'}">
                    ${t.transaction_type}
                  </span>
                </td>
                <td>${t.quantity}</td>
                <td>${t.username}</td>
              </tr>
            `,
    )}
          ${(!this.transactions || this.transactions.length === 0)
        ? html`<tr>
                <td colspan="6" style="text-align:center; padding: 30px;">
                  Belum ada riwayat transaksi
                </td>
              </tr>`
        : ""}
        </tbody>
      </table>
    `;
  }

  renderProfileTab() {
    return html`
      <div
        class="admin-panel"
        style="margin-top: 25px; padding: 25px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);"
      >
        <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 1.2rem;">
          👤 Profil Pengguna
        </h3>
        <p style="font-size: 0.95rem; color: #cbd5e1; margin: 0 0 20px;">
          Anda login sebagai <strong>${this.role}</strong>.
        </p>

        <h4
          style="margin-top: 0; margin-bottom: 10px; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;"
        >
          🔑 Otorisasi Akses API Sendiri
        </h4>
        <p style="font-size: 0.9rem; color: #cbd5e1; margin: 0 0 15px;">
          Gunakan token ini untuk akses API (via Bearer token) dari aplikasi
          pihak ketiga tanpa perlu melewati login UI ulang.
        </p>
        <div
          style="display: flex; gap: 15px; align-items: flex-start; flex-direction: column;"
        >
          <button class="btn-secondary" @click="${this.generateOwnToken}">
            Generate Token Baru
          </button>
          ${this.apiToken
        ? html`<div
                class="api-token-display"
                style="margin-top: 5px; width: 100%; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                @click="${() => this.openTokenModal(this.role, this.apiToken)}"
                title="Klik untuk lihat token"
              >
                ${this.apiToken.substring(0, 30)}... (Klik untuk lihat token)
              </div>`
        : html`<span
                style="color: rgba(255,255,255,0.4); font-size: 0.85rem;"
                >Belum ada token</span
              >`}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h2>Inventory System Dashboard</h2>
          <div class="actions-bar">
            <span
              style="display:flex; align-items:center; opacity: 0.7; font-size: 0.9rem; margin-right: 10px;"
              >Login sebagai <b style="margin-left: 5px">${this.role}</b></span
            >
            <button class="btn-danger" @click="${this.logout}">Logout</button>
          </div>
        </div>

        ${this.errorMessage
        ? html`<p class="error">${this.errorMessage}</p>`
        : ""}
        <div class="tabs">
          <div
            class="tab ${this.activeTab === "products" ? "active" : ""}"
            @click="${() => this.setTab("products")}"
          >
            Products
          </div>
          <div
            class="tab ${this.activeTab === "transactions" ? "active" : ""}"
            @click="${() => this.setTab("transactions")}"
          >
            Riwayat Transaksi
          </div>
          ${this.role === "admin"
        ? html`
                <div
                  class="tab ${this.activeTab === "users" ? "active" : ""}"
                  @click="${() => this.setTab("users")}"
                >
                  User Management
                </div>
              `
        : html`
                <div
                  class="tab ${this.activeTab === "profile" ? "active" : ""}"
                  @click="${() => this.setTab("profile")}"
                >
                  Profil Saya
                </div>
              `}
        </div>

        ${this.activeTab === "products"
        ? this.renderProductsTab()
        : this.activeTab === "transactions"
          ? this.renderTransactionsTab()
          : this.activeTab === "users" && this.role === "admin"
            ? this.renderUsersTab()
            : this.renderProfileTab()}
      </div>

      ${this.showForm
        ? html`
            <product-form
              .product="${this.editingProduct || {
            name: "",
            stock: 0,
            price: 0,
          }}"
              .isEdit="${!!this.editingProduct}"
              @saved="${this.onFormSaved}"
              @closed="${this.onFormClosed}"
            ></product-form>
          `
        : ""}
      ${this.showUserForm
        ? html`
            <user-form
              @saved="${this.onUserFormSaved}"
              @closed="${this.onUserFormClosed}"
            ></user-form>
          `
        : ""}
      ${this.showTransactionForm
        ? html`
            <transaction-form
              .product="${this.mutatingProduct}"
              @saved="${this.onMutasiFormSaved}"
              @closed="${this.onMutasiFormClosed}"
            ></transaction-form>
          `
        : ""}
      ${this.showTokenModal
        ? html`
            <div class="modal-overlay" @click="${this.closeTokenModal}">
              <div class="modal-content" @click="${(e) => e.stopPropagation()}">
                <h3>Token API: ${this.modalTokenUser}</h3>
                <div
                  class="api-token-display"
                  style="margin-top: 15px; word-break: break-all; "
                >
                  ${this.modalTokenValue}
                </div>
                <div
                  style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;"
                >
                  <button
                    class="btn-secondary"
                    @click="${this.closeTokenModal}"
                  >
                    Tutup
                  </button>
                  <button class="btn-primary" @click="${this.copyToken}">
                    Salin Token
                  </button>
                </div>
              </div>
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("product-list", ProductList);
