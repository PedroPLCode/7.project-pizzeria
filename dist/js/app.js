import {classNames, select} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import API from './components/API.js';
import Booking from './components/Booking.js';
  
export const app = {
  initPages: function() {
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links)

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMathingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMathingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMathingHash);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function(event) {
        const clickedElement = this;
        event.preventDefault();

        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);

        if (id == 'booking') {
          thisApp.cart.clearMessages(); 
          thisApp.cart.closeCart(); 
        }

        window.location.hash = '#/' + id;
      })
    }
  }, 

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  flashElementDown(elementToFlash, classTochange) {  
      elementToFlash.classList.add(classTochange);
  },

  flashElementUp(elementToFlash, classTochange) {  
      elementToFlash.classList.remove(classTochange);
  },

  activatePage: async function(pageId) {
    const thisApp = this;

    for (let page of thisApp.pages) {
      thisApp.flashElementDown(page, classNames.pages.flashWhenUpdated);
      await thisApp.sleep(select.pages.delayTime);
      page.classList.toggle(
        classNames.pages.active, 
        page.id == pageId
        );
      await thisApp.sleep(select.pages.delayTime);
      thisApp.flashElementUp(page, classNames.pages.flashWhenUpdated);
    }

    for (let link of thisApp.navLinks) {
      thisApp.flashElementDown(link, classNames.nav.flashWhenUpdated);
      await thisApp.sleep(select.nav.delayTime);
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
        );
      await thisApp.sleep(select.nav.delayTime);
      thisApp.flashElementUp(link, classNames.nav.flashWhenUpdated);
    }
  },

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

  initBooking: function() {
    const thisApp = this;

    thisApp.bookingWidgetElement = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(thisApp.bookingWidgetElement);
  },

  init: function(){
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
  },
};

app.init();
