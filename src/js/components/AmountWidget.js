import {app} from '../app.js';
import {select, settings, messages} from '../settings.js';
import {utils} from '../utils.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor (element) {
    super(element, settings.amountWidget.defaultValue);
    this.getElements(element);
    this.initActions();
    this.value = settings.amountWidget.defaultValue;
  }

  getElements(element){
    this.dom = {
      wrapper: element,
      input: this.dom.wrapper.querySelector(select.widgets.amount.input),
      linkDecrease: this.dom.wrapper.querySelector(select.widgets.amount.linkDecrease),
      linkIncrease: this.dom.wrapper.querySelector(select.widgets.amount.linkIncrease),
    };
  }

  initActions() {
    let valueToChange = 1;
    this.dom.input.addEventListener('change', () => {
      app.cart.clearMessages(select.cart.message);
      this.value = this.dom.input.value;
    });

    this.dom.linkDecrease.addEventListener('click', value => {
      value.preventDefault();
      app.cart.clearMessages(select.cart.message);
      this.setValue(this.value - valueToChange);
    });

    this.dom.linkIncrease.addEventListener('click', value => {
      value.preventDefault();
      app.cart.clearMessages(select.cart.message);
      let closeHourClear = false;
      let otherBookingsClear = false;
      if (this !== app.booking.hoursAmountWidget) {
        closeHourClear = true;
        otherBookingsClear = true;
      } else {
        valueToChange = 0.5;
        const maxTimetoClose = settings.hours.close - utils.hourToNumber(app.booking.hourPicker.value);
        if (this.value < maxTimetoClose) {
          closeHourClear = true;
        }
        let maxTimetoNextBooking;
        for (let timeIndex = utils.hourToNumber(app.booking.hourPicker.value); timeIndex < 24; timeIndex += valueToChange) {
          if (!app.booking.booked[app.booking.datePicker.value][timeIndex]) {
            app.booking.booked[app.booking.datePicker.value][timeIndex] = [];
          }            
          let timeToNextBooking;
          if (app.booking.selectedTables) {
            for (let singleSelectedTable of app.booking.selectedTables) {
              if ((app.booking.booked[app.booking.datePicker.value][timeIndex]).includes(parseInt(singleSelectedTable))) {
                timeToNextBooking = timeIndex - utils.hourToNumber(app.booking.hourPicker.value);
              }
              if ((timeToNextBooking < maxTimetoNextBooking) || !maxTimetoNextBooking) {
                maxTimetoNextBooking = timeToNextBooking;
              }
            }
          }
        }
        if ((this.value < maxTimetoNextBooking) || (maxTimetoNextBooking === undefined)) {
          otherBookingsClear = true;
        }
      }
      if (closeHourClear && otherBookingsClear) {
        this.setValue(this.value + valueToChange);
      } else {
        app.cart.clearMessages(select.cart.message);
        app.cart.printMessage(messages.booking.bookingTooLong, select.cart.message);
      }
    });
  }

  renderValue() {
    this.dom.input.value = this.value;
  }

  parseValue(value) {
      return parseFloat(value);
  }

  isValid(value) {
    return !isNaN(value) && 
           value >= settings.amountWidget.defaultMin &&
           value <= settings.amountWidget.defaultMax;
  }
}

export default AmountWidget;