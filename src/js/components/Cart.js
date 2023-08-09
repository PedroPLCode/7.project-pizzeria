import {app} from '../app.js';
import {select, settings, classNames, messages, templates} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    this.products = [];
    this.getElements(element);
    this.initActions();
  }

  getElements(element) {
    this.dom = {
      wrapper: element,
      toggleTrigger: element.querySelector(select.cart.toggleTrigger),
      content: element.querySelector(select.cart.content),
      productList: document.querySelector(select.containerOf.cart),
      deliveryFee: element.querySelector(select.cart.deliveryFee),
      subtotalPrice: element.querySelector(select.cart.subtotalPrice),
      totalPrice: element.querySelectorAll(select.cart.totalPrice),
      totalNumber: element.querySelector(select.cart.totalNumber),
      form: element.querySelector(select.cart.form),
      address: element.querySelector(select.cart.address),
      phone: element.querySelector(select.cart.phone),
    };
  }

  initActions() {
    this.dom.toggleTrigger.addEventListener('click', function(event) {
      event.preventDefault();
        
      app.cart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    this.dom.productList.addEventListener('updated', function() {
      app.cart.update();
    });

    this.dom.productList.addEventListener('remove', function(event) {
      app.cart.remove(event.detail.cartProduct);
    });

    this.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      app.api.sentOrder();
    });

    this.dom.address.addEventListener('change', function() {
      app.api.validate(app.cart.dom.address.value.length >= 6, 
                       messages.error.address, 
                       select.cart.message, 
                       app.cart.dom.address, 
                       classNames.cart.wrapperError);
    });

    this.dom.phone.addEventListener('change', function() {
      app.api.validate(app.cart.dom.phone.value.length == 9, 
                       messages.error.phone, 
                       select.cart.message, 
                       app.cart.dom.phone, 
                       classNames.cart.wrapperError);
    });
  }

  add(menuProduct) {
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(generatedDOM);

    this.products.push(new CartProduct(menuProduct, generatedDOM));

    this.clearMessages(select.cart.message);
    this.update();
  }

  async update() {
    this.deliveryFee = settings.cart.defaultDeliveryFee;
    this.totalNumber = 0;
    this.subtotalPrice = 0;

    for (let singleProduct of this.products) {
      this.totalNumber += singleProduct.amount;
      this.subtotalPrice += singleProduct.price;
    }

    if (!this.products.length) {
      this.deliveryFee = 0;
    }

    this.totalPrice = this.subtotalPrice + this.deliveryFee;

    app.flashElementDown(this.dom.wrapper, classNames.cart.flashWhenUpdated);
    await app.sleep(select.cart.delayTime);

    this.dom.deliveryFee.innerHTML = this.deliveryFee;
    this.dom.totalNumber.innerHTML = this.totalNumber;
    this.dom.subtotalPrice.innerHTML = this.subtotalPrice;

    for (let singleTotalPrice of this.dom.totalPrice) {
      singleTotalPrice.innerHTML = this.totalPrice;
    }
    app.flashElementUp(this.dom.wrapper, classNames.cart.flashWhenUpdated);
  }

  remove(productToRemove) {
    productToRemove.dom.wrapper.remove();
    const indexToRemove = this.products.indexOf(productToRemove);
    this.products.splice(indexToRemove, 1);
    this.update();
  }

  printMessage(msgs, location) {
    for (let msg of msgs) {
      let div = document.createElement('div');
      div.innerHTML = msg;
      document.querySelector(location).appendChild(div);
    }
  }
    
  clearMessages(location) {
    document.querySelector(location).innerHTML = '';
  } 

  resetToDefault() {
    for (let singleProduct of this.products) {
      singleProduct.dom.wrapper.remove();
    }
    this.products = [];
    this.update();
  } 

  closeCart(){
    this.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
  }
}

export default Cart;