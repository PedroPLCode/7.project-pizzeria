import {app} from '../app.js';
import {select, messages} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class CartProduct {
  constructor(menuProduct, element) {
    const thisCartProduct = this;

    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.paramsOnlyIds = menuProduct.paramsOnlyIds;
    thisCartProduct.id = menuProduct.id;

    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget(thisCartProduct.amount);
    thisCartProduct.initActions();
  }

    
  getElements(element) {
    const thisCartProduct = this;

    thisCartProduct.dom = {
      wrapper: element,
      amountWidget: element.querySelector(select.cartProduct.amountWidget),
      price: element.querySelector(select.cartProduct.price),
      edit: element.querySelector(select.cartProduct.edit),
      remove: element.querySelector(select.cartProduct.remove),
    };
  }


  initAmountWidget(amount) {
    const thisCartProduct = this;

    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

    thisCartProduct.amountWidget.setValue(amount);

    thisCartProduct.dom.amountWidget.addEventListener('updated', function(event){
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

    thisCartProduct.dom.edit.addEventListener('click', function(event) {
      event.preventDefault();
      app.cart.clearMessages();
      app.cart.printMessage(messages.editNotImplemented);
    });

    thisCartProduct.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      app.cart.clearMessages();
      thisCartProduct.remove();
    });
  }


  remove() {
    const thisCartProduct = this;

    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      },
    });

    thisCartProduct.dom.wrapper.dispatchEvent(event);
  }


  getData() {
    const thisCartProduct = this;

    return {
      name: thisCartProduct.id,
      amount: thisCartProduct.amount,
      price: thisCartProduct.price,
      priceSingle: thisCartProduct.priceSingle,
      params: thisCartProduct.paramsOnlyIds,
    }
  }
}

export default CartProduct;