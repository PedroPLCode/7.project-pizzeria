import BaseWidget from '../components/BaseWidget.js';
import {utils} from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.dom.calendarLocation = document.querySelector(select.booking.floorPlan),
    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date();
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, {
      defaultDate: utils.addDays(thisWidget.minDate, 1),
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      altInput: true,
      altFormat: "F j, Y",
      dateFormat: "Y-m-d",
      position: "above left",
      positionElement: thisWidget.dom.calendarLocation,
      locale: {
        firstDayOfWeek: 1
      },
      disable: [
        function(date) {
          return (date.getDay() === 1);
        }
      ],
      onChange: function(selectedDates, dateStr) {
        thisWidget.value = dateStr;
        //tutaj dodać jakieś komunikaty dla uzytkownika.
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
