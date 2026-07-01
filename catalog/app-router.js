import { LitElement, html } from "/lit-core.min.js";
import "/login-form.js";
import "/product-list.js";
import "/toast-notification.js";
import "/confirm-modal.js";
import "/user-form.js";

class AppRouter extends LitElement {
  static properties = {
    route: { type: String },
  };

  constructor() {
    super();
    this.updateRoute();
    window.onpopstate = () => {
      this.updateRoute();
    };

    window.addEventListener("login-success", () => {
      this.navigateTo("products");
    });

    window.addEventListener("logout", () => {
      localStorage.removeItem("token");
      this.navigateTo("login");
    });
  }

  updateRoute() {
    const token = localStorage.getItem("token");
    const path = window.location.pathname.replace(/^\/+/, "");

    if (!token) {
      this.route = "login";
      window.history.replaceState({}, "", "/login");
    } else {
      this.route = path || "products";
    }
  }

  navigateTo(route) {
    window.history.pushState({}, "", "/" + route);
    this.updateRoute();
  }

  render() {
    return html`
      ${this.route === "login"
        ? html` <login-form></login-form> `
        : html` <product-list></product-list> `}
      <toast-notification></toast-notification>
      <confirm-modal></confirm-modal>
    `;
  }
}

customElements.define("app-router", AppRouter);
