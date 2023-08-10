import {classNames, select} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import API from './components/API.js';
import Booking from './components/Booking.js';
import HomePage from './components/HomePage.js';
  
export const app = {
  initPages: function() {
    this.pages = document.querySelector(select.containerOf.pages).children;
    this.navLinks = document.querySelectorAll(select.nav.links)

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMathingHash = this.pages[0].id;

    for (let page of this.pages) {
      if (page.id == idFromHash) {
        pageMathingHash = page.id;
        break;
      }
    }
    app.activate(pageMathingHash);

    for (let link of this.navLinks) {
      link.addEventListener('click', event => {
        const clickedElement = link;
        event.preventDefault();
        const id = clickedElement.getAttribute('href').replace('#', '');
        app.handleLinkClicked(id);
      })
    }
  }, 

  handleLinkClicked(id) {
    app.activate(id);
    app.cart.clearMessages(select.cart.message); 
    app.cart.closeCart(); 
    window.location.hash = `#/${id}`;
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

  async activatePage(pageId) {
    const pagesToReload = document.querySelector(select.pages.wrapper);
    app.flashElementDown(pagesToReload, classNames.pages.flashWhenUpdated);
    await app.sleep(select.pages.delayTime);

    for (let page of this.pages) {
      page.classList.toggle(
        classNames.pages.active, 
        page.id == pageId
        );
    }

    if (app.homePage.carousel.flickity) {
      app.homePage.carousel.flickity.destroy();
      app.homePage.carousel.initPlugin();
    }
    app.flashElementUp(pagesToReload, classNames.pages.flashWhenUpdated);
  },

  async activateLinks(pageId) {
    const linksToReload = document.querySelector(select.nav.wrapper);
    app.flashElementDown(linksToReload, classNames.nav.flashWhenUpdated);
    await app.sleep(select.nav.delayTime);

    for (let link of this.navLinks) {
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == `#${pageId}`
       );
    }
    app.flashElementUp(linksToReload, classNames.nav.flashWhenUpdated);
  },

  activate: function(pageId) {
    app.activatePage(pageId);
    app.activateLinks(pageId);
  },

  initMenu: function() {
    this.productsArray = [];
    for (let productData in this.data.products) {
      this.productsArray.push(new Product(this.data.products[productData].id, this.data.products[productData]));
    }
  },

  initData: function() {
    this.data = {};
    this.api = new API();
    app.api.getProductsData();
  },

  initCart: function() {
    const cartElem = document.querySelector(select.containerOf.cart);
    this.cart = new Cart(cartElem);

    this.productList = document.querySelector(select.containerOf.menu);
    this.productList.addEventListener('add-to-cart', event => {
      app.cart.add(event.detail.product);
    });
  },

  initBooking: function() {
    this.bookingWidgetElement = document.querySelector(select.containerOf.booking);
    this.booking = new Booking(this.bookingWidgetElement);
  },

  initHomePage: function() {
    this.homePageElement = document.querySelector(select.containerOf.homePage);
    this.homePage = new HomePage(this.homePageElement);
  },

  init: function(){
    app.initHomePage();
    app.initPages();
    app.initData();
    app.initCart();
    app.initBooking();
  },
};

app.init();
