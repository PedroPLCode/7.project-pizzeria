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
      app.cart.clearMessages(select.cart.message);
      app.cart.printMessage([`Peoples amount: ${app.booking.peopleAmountWidget.value}`], select.cart.message);
      if (!app.booking.selectedTables || app.booking.selectedTables.length == 0) {
        app.cart.printMessage([`No tables selected.`], select.cart.message);
      } else {
        app.cart.printMessage([`Table(s): ${app.booking.selectedTables}`], select.cart.message);
      }
    });

    this.dom.hoursAmount.addEventListener('click', event => {
      event.preventDefault();
      app.cart.clearMessages(select.cart.message);
      app.cart.printMessage([`Hours amount: ${app.booking.hoursAmountWidget.value}`], select.cart.message);
      if (!app.booking.selectedTables || app.booking.selectedTables.length == 0) {
        app.cart.printMessage([`No tables selected.`], select.cart.message);
      } else {
        app.cart.printMessage([`Table(s): ${app.booking.selectedTables}`], select.cart.message);
      }
    });

    this.dom.datePicker.addEventListener('updated', event => {
      event.preventDefault();
      app.cart.clearMessages(select.cart.message);
      app.cart.printMessage(messages.booking.date, select.cart.message);
    });

    this.dom.hourPicker.addEventListener('updated', event => {
      event.preventDefault();
      app.cart.clearMessages(select.cart.message);
      app.cart.printMessage(messages.booking.time, select.cart.message);
    });

    for (let checkbox of this.dom.checkboxes) {
      checkbox.addEventListener('change', event => {
        event.preventDefault();
        const selectedStarters = [];
        for (let singleCheckbox of app.booking.dom.checkboxes) {
          if (singleCheckbox.checked) {
            selectedStarters.push(singleCheckbox.value);
          }
        }
        app.cart.clearMessages(select.cart.message);
        if (selectedStarters.length != 0) {
          app.cart.printMessage(['Starters:', `${selectedStarters}`], select.cart.message);
        } else {
          app.cart.printMessage(['No starters selected.'], select.cart.message);
        }
      });
    }

    this.dom.wrapper.addEventListener('updated', event => {
      app.booking.updateDOM();
      if (app.booking.selectedTables) {
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
      this.hoursAmountWidget.value = 1;
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
      this.makeBooked(item.date, item.hour, item.duration, item.tables);
    }

    for (let item of eventCurrent) {
      this.makeBooked(item.date, item.hour, item.duration, item.tables);
    }
    const minDate = this.datePicker.minDate;
    const maxDate = this.datePicker.maxDate;

    for (let item of eventRepeat) {
      if (item.repeat == "daily") {
        for (let indexDate = minDate; indexDate <= maxDate; indexDate = utils.addDays(indexDate, 1)) {
          this.makeBooked(utils.dateToStr(indexDate), item.hour, item.duration, item.tables);
        }
      }
    }
    this.updateDOM();
  }

  makeBooked(date, hour, duration, tables) {
    for (let table of tables) {
      if (typeof this.booked[date] == 'undefined') {
        this.booked[date] = {};
      }
      const startHour = utils.hourToNumber(hour);
      for (let indexHour = startHour; indexHour < startHour + duration; indexHour += 0.5) {
        if (typeof this.booked[date][indexHour] == 'undefined') {
          this.booked[date][indexHour] = [];
        }
        this.booked[date][indexHour].push(parseInt(table));
      }
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
    this.updateHourPickerColors();
  }

  resetTables() {
    app.booking.selectedTables = [];
    for (let table of this.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected); 
    }
  }

  initTables(event) {
    const tableClicked = event.target.getAttribute(select.booking.dataTable);
    if (!this.selectedTables) {
      this.selectedTables = [];
    }
    app.cart.clearMessages(select.cart.message);

    if (event.target.classList.contains(classNames.booking.singleTable)) {
      if (event.target.classList.contains(classNames.booking.tableBooked)) {
        app.cart.clearMessages(select.cart.message);
        app.cart.printMessage(messages.booking.tableAlreadyBooked, select.cart.message);
      } else {
        if (event.target.classList.contains(classNames.booking.tableSelected)) {
          event.target.classList.remove(classNames.booking.tableSelected); 
          const indexToRemove = this.selectedTables.indexOf(parseInt(tableClicked));
          this.selectedTables.splice(indexToRemove, 1);
          app.cart.clearMessages(select.cart.message);
          const message = [`Table(s) ${this.selectedTables} selected.`, 'Check hours amount.'];
          app.cart.printMessage(message, select.cart.message);
          if (this.selectedTables.length === 0) {
            app.cart.clearMessages(select.cart.message);
            app.cart.printMessage(messages.booking.tableNotSelected, select.cart.message);
          }
        } else {
          event.target.classList.add(classNames.booking.tableSelected); 
          this.selectedTables.push(parseInt(tableClicked));
          app.cart.clearMessages(select.cart.message);
          const message = [`Table(s) ${this.selectedTables} selected.`];
          app.cart.printMessage(message, select.cart.message);
        }
      }
    } 
  }

  determineSingleColor(howBusy) {
    if (howBusy >= 3) {
      return 'red';
    } else if (howBusy == 2) {
      return 'orange';
    } else {
      return 'green';
    }
  }

  determineRangeSliderFill() {
    const timeJump = 0.5;
    let linearGradientString = 'linear-gradient(to right';
    let ratingPart = 0;
    for (let timePeriod = settings.hours.open; timePeriod <= settings.hours.close; timePeriod += timeJump) {
      const nextRatingPart = ratingPart + (100 / ((settings.hours.close - settings.hours.open) / timeJump));
      const stringToAdd = ` ,${this.determineSingleColor(this.howBusy[timePeriod])} ${ratingPart}% ${nextRatingPart}%`;
      ratingPart = nextRatingPart;
      linearGradientString += stringToAdd;
    }
    return `${linearGradientString})`;
  }
  
  updateHourPickerColors() {
    this.howBusy = {};
    for (let singleDayBooking in app.booking.booked) {
      if (singleDayBooking === app.booking.datePicker.value) {
        for (let singleHourBooking in app.booking.booked[singleDayBooking]) {
          this.howBusy[singleHourBooking] = app.booking.booked[singleDayBooking][singleHourBooking].length;
        }
      }
    }
    this.dom.rangeSlider = document.querySelector(select.widgets.hourPicker.rangeSlider);
    const rangeSliderFill = this.determineRangeSliderFill();
    this.dom.rangeSlider.style.background = rangeSliderFill;
  }
}

export default Booking;