import BaseWidget from '../components/BaseWidget.js';
import {utils} from '../utils.js';
import {app} from '../app.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    this.dom.input = this.dom.wrapper.querySelector(select.widgets.datePicker.input);
    this.dom.calendarLocation = document.querySelector(select.booking.floorPlan),
    this.initPlugin();
  }
  initPlugin(){
    this.minDate = new Date();
    this.maxDate = utils.addDays(this.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    flatpickr(this.dom.input, {
      defaultDate: this.minDate,
      minDate: this.minDate,
      maxDate: this.maxDate,
      altInput: true,
      altFormat: "F j, Y",
      dateFormat: "Y-m-d",
      position: "above left",
      positionElement: this.dom.calendarLocation,
      locale: {
        firstDayOfWeek: 1
      },
      responsive: {
        small: {
          display: 'bottom',
        },
        medium: {
          display: 'center',
        },
        large: {
          display: 'anchored,'
        }
      },
      showWeekNumbers: true,
      onChange: function(selectedDates, dateStr) {
        app.booking.datePicker.value = dateStr;
      },
    });
  }
  
  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){}
}

export default DatePicker;
