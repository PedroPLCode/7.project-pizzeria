import {app} from '../app.js';
import {select, settings, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.renderInMenu();
    this.getElements();
    this.initAccordion();
    this.initOrderForm();
    this.initAmountWidget();
    this.processOrder();
  }

  renderInMenu() {
    const generatedHTML = templates.menuProduct(this.data);
    this.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(this.element);
  }

  getElements(){
    this.dom = {
      accordionTrigger: this.element.querySelector(select.menuProduct.clickable),
      cartButton: this.element.querySelector(select.menuProduct.cartButton),
      priceElem: this.element.querySelector(select.menuProduct.priceElem),
      imageWrapper: this.element.querySelector(select.menuProduct.imageWrapper),
      amountWidgetElem: this.element.querySelector(select.menuProduct.amountWidget),
      form: this.element.querySelector(select.menuProduct.form),
      formInputs: this.element.querySelectorAll(select.menuProduct.form, select.all.formInputs),
    };
  }

  initAccordion() {
    const thisProduct = this;

    this.dom.accordionTrigger.addEventListener('click', function (event) {
      event.preventDefault();
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      if (activeProduct && activeProduct != thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      app.cart.clearMessages(select.cart.message);
    });
  }

  initOrderForm() {
    const thisProduct = this;
    
    this.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
      
    for(let input of this.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
      
    this.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.resetToDefault();
    });
  }

  initAmountWidget() {
    const thisProduct = this;
    this.amountWidget = new AmountWidget(this.dom.amountWidgetElem);

    this.dom.amountWidgetElem.addEventListener('updated', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
  }

  processOrder() {      
    const formData = utils.serializeFormToObject(this.dom.form);
    let price = this.data.price;
      
    for(let paramId in this.data.params) {
      const param = this.data.params[paramId];
      
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionImage = this.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          if (!option.default) {
            price += option.price;
          }
          if (optionImage) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          if (option.default) {
            price -= option.price;
          }
          if (optionImage) {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
    this.priceSingle = price;
    price *= this.amountWidget.value;
    this.dom.priceElem.innerHTML = price;
    app.cart.clearMessages(select.cart.message);
  }

  resetToDefault() {      
    this.dom.form.reset();
    this.amountWidget.setValue(settings.amountWidget.defaultValue); 
      
    for(let paramId in this.data.params) {
      const param = this.data.params[paramId];
      
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionImage = this.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);

        if (option.default) {
          if (optionImage) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          if (optionImage) {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      } 
    }
    this.dom.priceElem.innerHTML = this.data.price;
  }

  prepareCartProductParams() {
    const formData = utils.serializeFormToObject(this.dom.form);
    const params = {};
      
    for(let paramId in this.data.params) {
      const param = this.data.params[paramId];

      params[paramId] = {
        label: param.label,
        options: {},
      }
      
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }

  prepareCartProductParamsOnlyIds() {
    const formData = utils.serializeFormToObject(this.dom.form);
    const paramsOnlyIds = {};
      
    for(let paramId in this.data.params) {
      const param = this.data.params[paramId];

      paramsOnlyIds[paramId] = {}
      const listOfSelected = [];
      
      for(let optionId in param.options) {
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          listOfSelected.push(optionId);
        }
      }
      paramsOnlyIds[paramId] = listOfSelected;
    }
    return paramsOnlyIds;
  }

  prepareCartProduct() {
    return {
      id: this.id,
      name: this.data.name,
      amount: this.amountWidget.value,
      priceSingle: this.priceSingle,
      price: this.priceSingle * this.amountWidget.value,
      params: this.prepareCartProductParams(),
      paramsOnlyIds: this.prepareCartProductParamsOnlyIds(),
    };
  }

  addToCart() {
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: this.prepareCartProduct(),
      }
    });
    this.element.dispatchEvent(event);
  }
}

export default Product;