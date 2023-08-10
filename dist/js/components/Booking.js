import {app} from '../app.js';
import {classNames, messages, select, settings, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js'
import DatePicker from './DatePicker.js'
import HourPicker from './HourPicker.js'

class Booking {
  constructor(element) { 
    this.render(element);
    this.getElements(element);
    this.initWidgets();
    app.api.getBookingsAndEventsData(this.datePicker.minDate, this.datePicker.maxDate);
    this.selectedTable = false;
  }

  render(element) {
    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    element.appendChild(generatedDOM);
  }

  getElements(element) {
    this.dom = {
      wrapper: element,
      peopleAmount: element.querySelector(select.booking.peopleAmount),
      hoursAmount: element.querySelector(select.booking.hoursAmount), 
      datePicker: element.querySelector(select.widgets.datePicker.wrapper),
      hourPicker: element.querySelector(select.widgets.hourPicker.wrapper),
      floorPlan: element.querySelector(select.booking.floorPlan),
      tables: element.querySelectorAll(select.booking.tables),
      bookingButton: element.querySelector(select.booking.bookingButton),
      email: element.querySelector(select.booking.email),
      phone: element.querySelector(select.booking.phone),
      checkboxes: element.querySelectorAll(select.booking.checkboxes),
    };
  }

  initWidgets() {
    this.peopleAmountWidget = new AmountWidget (this.dom.peopleAmount);
    this.hoursAmountWidget = new AmountWidget (this.dom.hoursAmount);
    this.datePicker = new  DatePicker (this.dom.datePicker);
    this.hourPicker = new HourPicker (this.dom.hourPicker);
    
    this.dom.peopleAmount.addEventListener('click', event => {
      event.preventDefault();
    });

    this.dom.hoursAmount.addEventListener('click', event => {
      event.preventDefault();
    });

    this.dom.wrapper.addEventListener('updated', event => {
      app.booking.updateDOM();
      if (app.booking.selectedTable) {
        if (event.target == app.booking.dom.hourPicker) {
          app.booking.resetTables();
          app.cart.clearMessages(select.cart.message);
          app.cart.printMessage(messages.booking.timeChanged, select.cart.message);
        } else if (event.target == app.booking.dom.datePicker) {
          app.booking.resetTables();
          app.cart.clearMessages(select.cart.message);
          app.cart.printMessage(messages.booking.dateChanged, select.cart.message); 
        }
      }
    })

    this.dom.floorPlan.addEventListener('click', event => {
      app.booking.initTables(event);
    })

    this.dom.bookingButton.addEventListener('click', event => {
      event.preventDefault();
      app.api.sentBooking();
    })

    this.dom.email.addEventListener('change', () => {
      app.api.validate(app.booking.dom.email.value.includes('@') && 
                      app.booking.dom.email.value.includes('.'), 
                       messages.error.email, 
                       select.cart.message, 
                       app.booking.dom.email, 
                       classNames.cart.wrapperError);
    })

    this.dom.phone.addEventListener('change', () => {
      app.api.validate(app.booking.dom.phone.value.length == 9, 
                       messages.error.phone, 
                       select.cart.message, 
                       app.booking.dom.phone, 
                       classNames.cart.wrapperError);
    })
  }

  parseData(bookings, eventCurrent, eventRepeat) {
    this.booked = {};

    for (let item of bookings) {
      this.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventCurrent) {
      this.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    const minDate = this.datePicker.minDate;
    const maxDate = this.datePicker.maxDate;

    for (let item of eventRepeat) {
      if (item.repeat == "daily") {
        for (let indexDate = minDate; indexDate <= maxDate; indexDate = utils.addDays(indexDate, 1)) {
          this.makeBooked(utils.dateToStr(indexDate), item.hour, item.duration, item.table);
        }
      }
    }
    this.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    if (typeof this.booked[date] == 'undefined') {
      this.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for (let indexHour = startHour; indexHour < startHour + duration; indexHour += 0.5) {
      if (typeof this.booked[date][indexHour] == 'undefined') {
        this.booked[date][indexHour] = [];
      }
      this.booked[date][indexHour].push(table);
    }
  }

  updateDOM() {
    this.date = this.datePicker.value;
    this.hour = utils.hourToNumber(this.hourPicker.value);
    let allAvaileable = false;

    if (typeof this.booked[this.date] == 'undefined' ||
        typeof this.booked[this.date][this.hour] == 'undefined') {
          allAvaileable = true;
        }

    for (let table of this.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (!allAvaileable && this.booked[this.date][this.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  resetTables() {
    this.selectedTable = false;
    for (let table of this.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected); 
    }
  }

  initTables(event) {
    const tableClicked = event.target.getAttribute(select.booking.dataTable);
    this.selectedTable = false;

    app.cart.clearMessages(select.cart.message);
    
    for (let table of this.dom.tables) {
      if (table != event.target) {
        table.classList.remove(classNames.booking.tableSelected); 
      }
    }

    if (event.target.classList.contains(classNames.booking.singleTable)) {
      if (event.target.classList.contains(classNames.booking.tableBooked)) {
        app.cart.clearMessages(select.cart.message);
        app.cart.printMessage(messages.booking.tableAlreadyBooked, select.cart.message);
      } else {
        if (event.target.classList.contains(classNames.booking.tableSelected)) {
          event.target.classList.remove(classNames.booking.tableSelected); 
          this.selectedTable = false;
          app.cart.clearMessages(select.cart.message);
          app.cart.printMessage(messages.booking.tableNotSelected, select.cart.message);
        } else {
          event.target.classList.add(classNames.booking.tableSelected); 
          this.selectedTable = tableClicked;
          app.cart.clearMessages(select.cart.message);
          const message = ['Table ' + tableClicked + ' selected.'];
          app.cart.printMessage(message, select.cart.message);
        }
      }
    } 
  }
}

export default Booking;