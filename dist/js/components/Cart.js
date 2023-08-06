import {app} from '../app.js';
import {select, settings, classNames, messages, templates} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {
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
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
      event.preventDefault();
        
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      app.api.sentOrder();
    });

    thisCart.dom.address.addEventListener('change', function() {
      app.api.validate(thisCart.dom.address.value.length >= 6, 
                       messages.error.address, 
                       select.cart.message, 
                       thisCart.dom.address, 
                       classNames.cart.wrapperError);
    });

    thisCart.dom.phone.addEventListener('change', function() {
      app.api.validate(thisCart.dom.phone.value.length == 9, 
                       messages.error.phone, 
                       select.cart.message, 
                       thisCart.dom.phone, 
                       classNames.cart.wrapperError);
    });
  }

  add(menuProduct) {
    const thisCart  = this;

    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

    thisCart.clearMessages(select.cart.message);
    thisCart.update();
  }

  async update() {
    const thisCart  = this;

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let singleProduct of thisCart.products) {
      thisCart.totalNumber += singleProduct.amount;
      thisCart.subtotalPrice += singleProduct.price;
    }

    if (!thisCart.products.length) {
      thisCart.deliveryFee = 0;
    }

    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

    app.flashElementDown(thisCart.dom.wrapper, classNames.cart.flashWhenUpdated);
    await app.sleep(select.cart.delayTime);

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

    for (let singleTotalPrice of thisCart.dom.totalPrice) {
      singleTotalPrice.innerHTML = thisCart.totalPrice;
    }
    app.flashElementUp(thisCart.dom.wrapper, classNames.cart.flashWhenUpdated);
  }

  remove(productToRemove) {
    const thisCart = this;
    productToRemove.dom.wrapper.remove();
    const indexToRemove = thisCart.products.indexOf(productToRemove);
    thisCart.products.splice(indexToRemove, 1);
    thisCart.update();
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
    const thisCart = this;
    for (let singleProduct of thisCart.products) {
      singleProduct.dom.wrapper.remove();
    }
    thisCart.products = [];
    thisCart.update();
  } 

  closeCart(){
    const thisCart = this;
    thisCart.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
  }
}

export default Cart;