import {app} from '../app.js';
import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor (element) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.initActions();
    thisWidget.value = settings.amountWidget.defaultValue;
  }


  getElements(element){
    const thisWidget = this;
    thisWidget.dom = {
      wrapper: element,
      input: thisWidget.dom.wrapper.querySelector(select.widgets.amount.input),
      linkDecrease: thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease),
      linkIncrease: thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease),
    };
  }


  initActions() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      app.cart.clearMessages();
      thisWidget.value = thisWidget.dom.input.value;
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function(value) {
      value.preventDefault();
      app.cart.clearMessages();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function(value) {
      value.preventDefault();
      app.cart.clearMessages();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }


  renderValue() {
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.value;
  }


  isValid(value) {
    return !isNaN(value) && 
           value >= settings.amountWidget.defaultMin &&
           value <= settings.amountWidget.defaultMax;
  }
}

export default AmountWidget;