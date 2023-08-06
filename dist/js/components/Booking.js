import {app} from '../app.js';
import {classNames, messages, select, settings, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js'
import DatePicker from './DatePicker.js'
import HourPicker from './HourPicker.js'

class Booking {
  constructor(element) { 
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.getElements(element);
    thisBooking.initWidgets();
    app.api.getBookingsAndEventsData(this.datePicker.minDate, this.datePicker.maxDate);
    thisBooking.selectedTable = false;
  }

  render(element) {
    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    element.appendChild(generatedDOM);
  }

  getElements(element) {
    const thisBooking = this;
    thisBooking.dom = {
      wrapper: element,
      peopleAmount: element.querySelector(select.booking.peopleAmount),
      hoursAmount: element.querySelector(select.booking.hoursAmount), 
      datePicker: element.querySelector(select.widgets.datePicker.wrapper),
      hourPicker: element.querySelector(select.widgets.hourPicker.wrapper),
      floorPlan: element.querySelector(select.booking.floorPlan),
      tables: element.querySelectorAll(select.booking.tables),
      bookingButton: element.querySelector(select.booking.bookingButton),
      address: element.querySelector(select.booking.address),
      phone: element.querySelector(select.booking.phone),
      checkboxes: element.querySelectorAll(select.booking.checkboxes),
    };
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new  DatePicker (thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker (thisBooking.dom.hourPicker);
    
    thisBooking.dom.peopleAmount.addEventListener('click', function(event){
      event.preventDefault();
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function(event){
      event.preventDefault();
    });

    thisBooking.dom.wrapper.addEventListener('updated', function() {
      thisBooking.resetTables(); //dlaczego resetują się gdy zmieniam peoples albo hours?
      thisBooking.updateDOM();
    })

    thisBooking.dom.floorPlan.addEventListener('click', function(event) {
      thisBooking.initTables(event);
    })

    thisBooking.dom.bookingButton.addEventListener('click', function(event) {
      event.preventDefault();
      app.api.sentBooking();
    })

    thisBooking.dom.address.addEventListener('change', function() {
      app.api.validate(thisBooking.dom.address.value.length >= 6, 
                       messages.order.error.address, 
                       select.cart.message, 
                       thisBooking.dom.address, 
                       classNames.cart.wrapperError);
    })

    thisBooking.dom.phone.addEventListener('change', function() {
      app.api.validate(thisBooking.dom.phone.value.length == 9, 
                       messages.order.error.phone, 
                       select.cart.message, 
                       thisBooking.dom.phone, 
                       classNames.cart.wrapperError);
    })
  }

  parseData(bookings, eventCurrent, eventRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for (let item of eventRepeat) {
      if (item.repeat == "daily") {
        for (let indexDate = minDate; indexDate <= maxDate; indexDate = utils.addDays(indexDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(indexDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for (let indexHour = startHour; indexHour < startHour + duration; indexHour += 0.5) {
      if (typeof thisBooking.booked[date][indexHour] == 'undefined') {
        thisBooking.booked[date][indexHour] = [];
      }
      thisBooking.booked[date][indexHour].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    let allAvaileable = false;

    if (typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
        typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
          allAvaileable = true;
        }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (!allAvaileable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  resetTables() {
    const thisBooking = this;
    thisBooking.selectedTable = false;
    for (let table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected); 
    }
  }

  initTables(event) {
    const thisBooking = this;
    const tableClicked = event.target.getAttribute(select.booking.dataTable);
    thisBooking.selectedTable = false;

    app.cart.clearMessages(select.cart.message);
    
    for (let table of thisBooking.dom.tables) {
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
          thisBooking.selectedTable = false;
          app.cart.clearMessages(select.cart.message);
          app.cart.printMessage(messages.booking.tableNotSelected, select.cart.message);
        } else {
          event.target.classList.add(classNames.booking.tableSelected); 
          thisBooking.selectedTable = tableClicked;
          app.cart.clearMessages(select.cart.message);
          const message = ['Table ' + tableClicked + ' selected.'];
          app.cart.printMessage(message, select.cart.message);
        }
      }
    } 
  }
}

export default Booking;