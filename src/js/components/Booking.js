//import {app} from '../app.js';
import {select, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js'

class Booking {
  constructor(element) { 
    const thisBooking = this;
    thisBooking.getElements(element);
    thisBooking.render();
    thisBooking.initWidgets();
    }

  getElements(element) {
    const thisBooking = this;

    thisBooking.dom = {
        wrapper: element,
        //peopleAmount: element.querySelector(select.booking.peopleAmount),
        //hoursAmount: element.querySelector(select.booking.hoursAmount), 
    };
  }

  render() {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisBooking.dom.wrapper.appendChild(generatedDOM);
  }

  initWidgets() {
    const thisBooking = this;
    
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);

    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount); 
    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);

    thisBooking.dom.peopleAmount.addEventListener('click', function(event){
        event.preventDefault();
        console.log('klik', this);
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function(event){
        event.preventDefault();
        console.log('klik', this);
    });

  }
}

export default Booking;