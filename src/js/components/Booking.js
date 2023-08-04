import {app} from '../app.js';
import {select, templates} from '../settings.js';
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
    };
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('click', function(event){
      event.preventDefault();
      console.log(this, thisBooking, thisBooking.peopleAmountWidget);
    });

    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('click', function(event){
      event.preventDefault();
      console.log(this, thisBooking, thisBooking.hoursAmountWidget);
    });

   thisBooking.datePicker = new  DatePicker (thisBooking.dom.datePicker);

   thisBooking.hourPicker = new HourPicker (thisBooking.dom.hourPicker);
  }
}

export default Booking;