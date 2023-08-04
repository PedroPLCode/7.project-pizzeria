import {app} from '../app.js';
import {classNames, select, settings, templates} from '../settings.js';
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
      tables: element.querySelectorAll(select.booking.tables),
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
      console.log(this, thisBooking, thisBooking.peopleAmountWidget);
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function(event){
      event.preventDefault();
      console.log(this, thisBooking, thisBooking.hoursAmountWidget);
    });

   thisBooking.dom.wrapper.addEventListener('updated', function() {
    thisBooking.updateDOM();
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
        for (let i = minDate; i <= maxDate; i = utils.addDays(i, 1)) { // i = loopDate
          thisBooking.makeBooked(utils.dateToStr(i), item.hour, item.duration, item.table);
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

    for (let i = startHour; i < startHour + duration; i += 0.5) { //i = hour
      if (typeof thisBooking.booked[date][i] == 'undefined') {
        thisBooking.booked[date][i] = [];
      }
      thisBooking.booked[date][i].push(table);
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
}

export default Booking;