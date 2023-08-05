import {app} from '../app.js';
import {utils} from '../utils.js';
import {select, settings, classNames, messages} from '../settings.js';

class API {

  getProductsData() {
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
        thisAPI.handleOrderError(error, messages.order.error.notSent);
      });
    } 
  } 

  orderSentOK() {
    const activeProduct = document.querySelector(select.all.menuProductsActive);
    activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
    app.cart.clearMessages(select.cart.message);
    app.cart.printMessage(messages.order.confirmation, select.cart.message);
    app.cart.resetToDefault();
  }

  handleError(errorCode, message) {
    app.cart.clearMessages(select.cart.message);
    messages.error.notSent.push(errorCode);
    app.cart.printMessage(message, select.cart.message);
    messages.error.notSent.pop();
  }

  sentBooking() {
    const thisAPI = this;
    const url = settings.db.url + '/' + settings.db.bookings;

    thisAPI.payload = {
      date: app.booking.datePicker.value,
      hour: app.booking.hourPicker.value,
      table: parseInt(app.booking.selectedTable),
      duration: app.booking.hoursAmountWidget.correctValue,
      ppl: app.booking.peopleAmountWidget.correctValue,
      starters: [],
      phone: app.booking.dom.phone.value, //walidacja wymagana
      address: app.booking.dom.address.value, //walidacja wymagana
    };

    for (let singleCheckbox of app.booking.dom.checkboxes) {
      if (singleCheckbox.checked) {
        thisAPI.payload.starters.push(singleCheckbox.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(thisAPI.payload),
    };

    //if (app.cart.validate(thisAPI.payload)) {
      fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsed response - sentOrder', parsedResponse);
        app.booking.makeBooked(thisAPI.payload.date, thisAPI.payload.hour, thisAPI.payload.duration, thisAPI.payload.table);
        thisAPI.BookingSentOK();
      })
      .catch((error) => {
        thisAPI.handleError(error, messages.booking.notSent);
      });
    //} 
  } 

  BookingSentOK() {
    const thisAPI = this;
    app.booking.resetTables();
    app.cart.clearMessages(select.cart.message);
    messages.booking.sentOK.push('Table ' + thisAPI.payload.table);
    messages.booking.sentOK.push('Date ' + thisAPI.payload.date);
    messages.booking.sentOK.push('Time ' + thisAPI.payload.hour);
    app.cart.printMessage(messages.booking.sentOK, select.cart.message);
    messages.booking.sentOK = messages.booking.sentOK.slice(0, -3);
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
        return Promise.all([
          bookingResponse.json(),
          eventCurrentResponse.json(),
          eventRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventCurrent, eventRepeat]) {
        app.booking.parseData(bookings, eventCurrent, eventRepeat);
      });
  }
}

export default API;