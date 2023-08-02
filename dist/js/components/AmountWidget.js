import {app} from '../app.js';
import {select, settings} from '../settings.js';

class AmountWidget {
  constructor (element) {
    const thisWidget = this;

    thisWidget.getElements(element);
    thisWidget.initActions();
    thisWidget.setValue(settings.amountWidget.defaultValue);
  }


  getElements(element){
    const thisWidget = this;
    
    thisWidget.dom = {
      element: element,
      input: element.querySelector(select.widgets.amount.input),
      linkDecrease: element.querySelector(select.widgets.amount.linkDecrease),
      linkIncrease: element.querySelector(select.widgets.amount.linkIncrease),
    };
  }


  initActions() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      app.cart.clearMessages();
      thisWidget.setValue(thisWidget.dom.input.value);
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


  announce() {
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true
    });

    thisWidget.dom.element.dispatchEvent(event);
  }


  setValue(value) {
    const thisWidget = this;

    const newValue = parseInt(value);

    const valueIsCorrect = thisWidget.value !== newValue && 
                             !isNaN(newValue) && 
                             newValue >= settings.amountWidget.defaultMin && 
                             newValue <= settings.amountWidget.defaultMax;

    if (valueIsCorrect) {
      thisWidget.value = newValue;
      thisWidget.announce();
    }

    thisWidget.dom.input.value = thisWidget.value;
  }
}

export default AmountWidget;