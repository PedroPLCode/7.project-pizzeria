import {app} from '../app.js';
import {select, settings, classNames, messages} from '../settings.js';

class API {

  getData() {
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url) 
    .then(function(rawResponse) {
      return rawResponse.json();
    })
    .then(function(parsedResponse) {
      app.data.products = parsedResponse;

      app.initMenu();
    });
  }


  sentOrder() {
    const thisAPI = this;

    const url = settings.db.url + '/' + settings.db.orders;

    thisAPI.payload = {
      address: app.cart.dom.address.value,
      phone: app.cart.dom.phone.value,
      totalPrice: app.cart.totalPrice,
      subtotalPrice: app.cart.subtotalPrice,
      totalNumber: app.cart.totalNumber,
      deliveryFee: app.cart.deliveryFee,
      products: [],
    };

    for(let prod of app.cart.products) {
      thisAPI.payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(thisAPI.payload),
    };
      
    app.cart.flash();

    if (app.cart.validate(thisAPI.payload)) {
      fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsed response - sentOrder', parsedResponse);
        thisAPI.orderSentOK();
      })
      .catch((error) => {
        thisAPI.handleError(error);
      });
    } 
  } 


  orderSentOK() {
    app.cart.resetToDefault();

    const activeProduct = document.querySelector(select.all.menuProductsActive);
    activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        
    app.cart.clearMessages();
    app.cart.printMessage(messages.confirmation);
  }


  handleError(errorCode) {
    app.cart.clearMessages();
    messages.error.notSent.push(errorCode);
    app.cart.printMessage(messages.error.notSent);
    messages.error.notSent.pop();
  }
}

export default API;