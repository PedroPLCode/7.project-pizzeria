import {select} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import API from './components/API.js';
  
export const app = {
  initMenu: function() {
    const thisApp = this;

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function() {
    const thisApp = this;
    thisApp.data = {};
    thisApp.api = new API();
    thisApp.api.getData();
  },

  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event) {
      app.cart.add(event.detail.product);
    });
  },

  init: function(){
    const thisApp = this;

    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();
