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

  validate(statementToCheck, msg, mgsLocation, inputFieldLocation = false, classToChange = false) {
    if (inputFieldLocation) {
      inputFieldLocation.classList.add(classToChange);
      app.cart.clearMessages(mgsLocation);
      app.cart.printMessage(msg, mgsLocation);
      if (statementToCheck) {
        inputFieldLocation.classList.remove(classToChange);
        app.cart.clearMessages(select.cart.message);
        return true;
      } 
    } else {
      app.cart.clearMessages(mgsLocation);
      app.cart.printMessage(msg, mgsLocation);
      if (statementToCheck) {
        app.cart.clearMessages(select.cart.message);
        return true;
      }
    }
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

    const validationSuccesfull = thisAPI.validate(thisAPI.payload.products.length != 0, 
                                                  messages.error.cart, 
                                                  select.cart.message) &&
                                 thisAPI.validate(thisAPI.payload.phone.length == 9, 
                                                  messages.error.phone, 
                                                  select.cart.message, 
                                                  app.cart.dom.phone, 
                                                  classNames.cart.wrapperError) &&
                                 thisAPI.validate(thisAPI.payload.address.length >= 6, 
                                                  messages.error.address, 
                                                  select.cart.message, 
                                                  app.cart.dom.address, 
                                                  classNames.cart.wrapperError);

    if (validationSuccesfull) {
      fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsed response - sentOrder', parsedResponse);
        thisAPI.handleOrderSent();
      })
      .catch((error) => {
        thisAPI.handleError(error, messages.error.orderNotSent);
      });
    } 
  } 

  handleOrderSent() {
    const activeProduct = document.querySelector(select.all.menuProductsActive);
    activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
    app.cart.clearMessages(select.cart.message);
    app.cart.printMessage(messages.order.confirmation, select.cart.message);
    app.cart.resetToDefault();
  }

  handleError(errorCode, message) {
    app.cart.clearMessages(select.cart.message);
    message.push(errorCode);
    app.cart.printMessage(message, select.cart.message);
    message.pop();
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
      phone: app.booking.dom.phone.value,
      email: app.booking.dom.email.value,
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

    const validationSuccesfull = thisAPI.validate(thisAPI.payload.table, 
                                                  messages.error.table, 
                                                  select.cart.message) &&
                                 thisAPI.validate(thisAPI.payload.phone.length == 9, 
                                                  messages.error.phone, 
                                                  select.cart.message, 
                                                  app.cart.dom.phone, 
                                                  classNames.cart.wrapperError) &&
                                 thisAPI.validate(thisAPI.payload.email.includes('@') && 
                                                  thisAPI.payload.email.includes('.'), 
                                                  messages.error.email, 
                                                  select.cart.message, 
                                                  app.cart.dom.email, 
                                                  classNames.cart.wrapperError);

    if (validationSuccesfull) {
      fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsed response - sentBooking', parsedResponse);
        app.booking.makeBooked(thisAPI.payload.date, thisAPI.payload.hour, thisAPI.payload.duration, thisAPI.payload.table);
        thisAPI.handleBookingSent();
      })
      .catch((error) => {
        thisAPI.handleError(error, messages.error.bookingNotSent);
      });
    } 
  } 

  handleBookingSent() {
    const thisAPI = this;
    app.booking.resetTables();
    app.cart.clearMessages(select.cart.message);
    messages.booking.confirmation.push('Table ' + thisAPI.payload.table + ' for ' + thisAPI.payload.ppl + ' persons');
    messages.booking.confirmation.push('At ' + thisAPI.payload.date + ' ' + thisAPI.payload.hour);
    app.cart.printMessage(messages.booking.confirmation, select.cart.message);
    messages.booking.confirmation = messages.booking.confirmation.slice(0, -3);
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