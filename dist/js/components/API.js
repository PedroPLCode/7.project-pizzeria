import {app} from '../app.js';
import {utils} from '../utils.js';
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
    const activeProduct = document.querySelector(select.all.menuProductsActive);
    activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        
    app.cart.clearMessages();
    app.cart.printMessage(messages.confirmation);

    app.cart.resetToDefault();
  }


  handleError(errorCode) {
    app.cart.clearMessages();
    messages.error.notSent.push(errorCode);
    app.cart.printMessage(messages.error.notSent);
    messages.error.notSent.pop();
  }


  getBookingsAndEventsData(minDate, maxDate) {
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventCurrent.join('&'),
      eventRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventCurrent),
      fetch(urls.eventRepeat),
    ])
      .then(function(allResponses) {
        const bookingResponse = allResponses[0];
        const eventCurrentResponse = allResponses[1];
        const eventRepeatResponse = allResponses[2]; 
        console.log(allResponses);
        console.log(bookingResponse);
        console.log(eventCurrentResponse);
        console.log(eventRepeatResponse);
        return Promise.all([
          bookingResponse.json(),
          eventCurrentResponse.json(),
          eventRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventCurrent, eventRepeat]) {
        console.log(bookings);
        console.log(eventCurrent);
        console.log(eventRepeat);
      });
  }
}

export default API;