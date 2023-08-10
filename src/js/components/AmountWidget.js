import {app} from '../app.js';
import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor (element) {
    super(element, settings.amountWidget.defaultValue);
    this.getElements(element);
    this.initActions();
    this.value = settings.amountWidget.defaultValue;
  }

  getElements(element){
    this.dom = {
      wrapper: element,
      input: this.dom.wrapper.querySelector(select.widgets.amount.input),
      linkDecrease: this.dom.wrapper.querySelector(select.widgets.amount.linkDecrease),
      linkIncrease: this.dom.wrapper.querySelector(select.widgets.amount.linkIncrease),
    };
  }

  initActions() {
    this.dom.input.addEventListener('change', () => {
      app.cart.clearMessages(select.cart.message);
      this.value = this.dom.input.value;
    });

    this.dom.linkDecrease.addEventListener('click', value => {
      value.preventDefault();
      app.cart.clearMessages(select.cart.message);
      this.setValue(this.value - 1);
    });

    this.dom.linkIncrease.addEventListener('click', value => {
      value.preventDefault();
      app.cart.clearMessages(select.cart.message);
      this.setValue(this.value + 1);
    });
  }

  renderValue() {
    this.dom.input.value = this.value;
  }

  isValid(value) {
    return !isNaN(value) && 
           value >= settings.amountWidget.defaultMin &&
           value <= settings.amountWidget.defaultMax;
  }
}

export default AmountWidget;