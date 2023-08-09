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
    const url = settings.db.url + '/' + settings.db.orders;

    this.payload = {
      address: app.cart.dom.address.value,
      phone: app.cart.dom.phone.value,
      totalPrice: app.cart.totalPrice,
      subtotalPrice: app.cart.subtotalPrice,
      totalNumber: app.cart.totalNumber,
      deliveryFee: app.cart.deliveryFee,
      products: [],
    };

    for(let prod of app.cart.products) {
      this.payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.payload),
    };

    const validationSuccesfull = this.validate(this.payload.products.length != 0, 
                                                  messages.error.cart, 
                                                  select.cart.message) &&
                                 this.validate(this.payload.phone.length == 9, 
                                                  messages.error.phone, 
                                                  select.cart.message, 
                                                  app.cart.dom.phone, 
                                                  classNames.cart.wrapperError) &&
                                 this.validate(this.payload.address.length >= 6, 
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
        app.api.handleOrderSent();
      })
      .catch((error) => {
        app.api.handleError(error, messages.error.orderNotSent);
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
    const url = settings.db.url + '/' + settings.db.bookings;

    this.payload = {
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
        this.payload.starters.push(singleCheckbox.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.payload),
    };

    const validationSuccesfull = this.validate(this.payload.table, 
                                                  messages.error.table, 
                                                  select.cart.message) &&
                                 this.validate(this.payload.phone.length == 9, 
                                                  messages.error.phone, 
                                                  select.cart.message, 
                                                  app.booking.dom.phone, 
                                                  classNames.cart.wrapperError) &&
                                 this.validate(this.payload.email.includes('@') && 
                                                  this.payload.email.includes('.'), 
                                                  messages.error.email, 
                                                  select.cart.message, 
                                                  app.booking.dom.email, 
                                                  classNames.cart.wrapperError);

    if (validationSuccesfull) {
      fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsed response - sentBooking', parsedResponse);
        app.booking.makeBooked(app.api.payload.date, app.api.payload.hour, app.api.payload.duration, app.api.payload.table);
        app.api.handleBookingSent();
      })
      .catch((error) => {
        app.api.handleError(error, messages.error.bookingNotSent);
      });
    } 
  } 

  handleBookingSent() {
    app.booking.resetTables();
    app.cart.clearMessages(select.cart.message);
    messages.booking.confirmation.push('Table ' + this.payload.table + ' for ' + this.payload.ppl + ' persons');
    messages.booking.confirmation.push('At ' + this.payload.date + ' ' + this.payload.hour);
    app.cart.printMessage(messages.booking.confirmation, select.cart.message);
    messages.booking.confirmation = messages.booking.confirmation.slice(0, -3);
  }
}

export default API;