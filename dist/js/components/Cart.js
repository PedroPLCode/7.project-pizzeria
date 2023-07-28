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
      thisCart.dom.address.classList.add(classNames.cart.wrapperError);
      thisCart.clearMessages();
      thisCart.printMessage(messages.error.address);
      if (thisCart.dom.address.value.length >= 6) {
        thisCart.dom.address.classList.remove(classNames.cart.wrapperError);
        thisCart.clearMessages();
      }
    });

    thisCart.dom.phone.addEventListener('change', function() {
      thisCart.dom.phone.classList.add(classNames.cart.wrapperError);
      thisCart.clearMessages();
      thisCart.printMessage(messages.error.phone);
      if (thisCart.dom.phone.value.length == 9) {
        thisCart.dom.phone.classList.remove(classNames.cart.wrapperError);
        thisCart.clearMessages();
      }
    });
  }


  add(menuProduct) {
    const thisCart  = this;

    const generatedHTML = templates.cartProduct(menuProduct);

    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

    thisCart.clearMessages();

    thisCart.update();
  }


  update() {
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

    thisCart.flash();

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

    for (let singleTotalPrice of thisCart.dom.totalPrice) {
      singleTotalPrice.innerHTML = thisCart.totalPrice;
    }
  }


  remove(productToRemove) {
    const thisCart = this;

    productToRemove.dom.wrapper.remove();

    const indexToRemove = thisCart.products.indexOf(productToRemove);
    thisCart.products.splice(indexToRemove, 1);

    thisCart.update();
  }


  printMessage(msgs) {

    for (let msg of msgs) {
      let div = document.createElement('div');
      div.innerHTML = msg;
      document.querySelector(select.cart.message).appendChild(div);
    }
  }
    

  clearMessages() {
    document.querySelector(select.cart.message).innerHTML = '';
  } 
  

  validate(payload) {
    const thisCart = this;
    thisCart.clearMessages();

    if (payload.products.length != 0) {
      thisCart.clearMessages();
      if (payload.phone.length == 9) {
        thisCart.dom.phone.classList.remove(classNames.cart.wrapperError);
        thisCart.clearMessages();
        if (payload.address.length >= 6) {
          thisCart.dom.address.classList.remove(classNames.cart.wrapperError);
          thisCart.clearMessages();
          return true;
        } else {
          thisCart.dom.address.classList.add(classNames.cart.wrapperError);
          thisCart.clearMessages();
          thisCart.printMessage(messages.error.address);
        }
      } else {
        thisCart.clearMessages();
        thisCart.printMessage(messages.error.phone);
        thisCart.dom.phone.classList.add(classNames.cart.wrapperError);
      }
    } else {
      thisCart.clearMessages();
      thisCart.printMessage(messages.error.cart);
    }
  }


  resetToDefault() {
    const thisCart = this;

    for (let singleProduct of thisCart.products) {
      singleProduct.dom.wrapper.remove();
    }

    thisCart.products = [];

    thisCart.update();
  } 

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async flash() {  
    const thisCart = this;

    thisCart.dom.toggleTrigger.classList.add(classNames.cart.flashWhenUpdated);
    thisCart.dom.form.classList.add(classNames.cart.flashWhenUpdated);
    await thisCart.sleep(select.cart.delayTime);
    thisCart.dom.toggleTrigger.classList.remove(classNames.cart.flashWhenUpdated);
    thisCart.dom.form.classList.remove(classNames.cart.flashWhenUpdated);
  }
}

export default Cart;