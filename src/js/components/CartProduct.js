import {app} from '../app.js';
import {select, messages} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class CartProduct {
  constructor(menuProduct, element) {
    this.id = menuProduct.id;
    this.name = menuProduct.name;
    this.amount = menuProduct.amount;
    this.priceSingle = menuProduct.priceSingle;
    this.price = menuProduct.price;
    this.paramsOnlyIds = menuProduct.paramsOnlyIds;
    this.id = menuProduct.id;

    this.getElements(element);
    this.initAmountWidget(this.amount);
    this.initActions();
  }
    
  getElements(element) {
    this.dom = {
      wrapper: element,
      amountWidget: element.querySelector(select.cartProduct.amountWidget),
      price: element.querySelector(select.cartProduct.price),
      edit: element.querySelector(select.cartProduct.edit),
      remove: element.querySelector(select.cartProduct.remove),
    };
  }

  initAmountWidget(amount) {
    const thisCartProduct = this;
    this.amountWidget = new AmountWidget(this.dom.amountWidget);
    this.amountWidget.setValue(amount);

    this.dom.amountWidget.addEventListener('updated', function(event){
      event.preventDefault();
      const amount = thisCartProduct.amountWidget.value;
      const price = thisCartProduct.priceSingle;
      thisCartProduct.amount = amount;
      thisCartProduct.price = amount * price;
      thisCartProduct.dom.price.innerHTML = price * amount;
    });
  }

  initActions() {
    const thisCartProduct = this;

    this.dom.edit.addEventListener('click', function(event) {
      event.preventDefault();
      app.cart.clearMessages(select.cart.message);
      app.cart.printMessage(messages.error.editNotImplemented, select.cart.message);
    });

    this.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      app.cart.clearMessages(select.cart.message);
      thisCartProduct.remove();
    });
  }

  remove() {
    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: this,
      },
    });
    this.dom.wrapper.dispatchEvent(event);
  }

  getData() {
    return {
      name: this.id,
      amount: this.amount,
      price: this.price,
      priceSingle: this.priceSingle,
      params: this.paramsOnlyIds,
    }
  }
}

export default CartProduct;