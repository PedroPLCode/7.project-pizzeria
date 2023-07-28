import {select, settings, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }


  renderInMenu() {
    const thisProduct = this;

    const generatedHTML = templates.menuProduct(thisProduct.data);

    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    const menuContainer = document.querySelector(select.containerOf.menu);

    menuContainer.appendChild(thisProduct.element);
  }


  getElements(){
    const thisProduct = this;

    thisProduct.dom = {
      accordionTrigger: thisProduct.element.querySelector(select.menuProduct.clickable),
      cartButton: thisProduct.element.querySelector(select.menuProduct.cartButton),
      priceElem: thisProduct.element.querySelector(select.menuProduct.priceElem),
      imageWrapper: thisProduct.element.querySelector(select.menuProduct.imageWrapper),
      amountWidgetElem: thisProduct.element.querySelector(select.menuProduct.amountWidget),
      form: thisProduct.element.querySelector(select.menuProduct.form),
      formInputs: thisProduct.element.querySelectorAll(select.menuProduct.form, select.all.formInputs),
    };
  }


  initAccordion() {
    const thisProduct = this;

    thisProduct.dom.accordionTrigger.addEventListener('click', function (event) {
      event.preventDefault();

      const activeProduct = document.querySelector(select.all.menuProductsActive);

      if (activeProduct && activeProduct != thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }

      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }


  initOrderForm() {
    const thisProduct = this;

    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
      
    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
      
    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.resetToDefault();
    });
  }


  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);

    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
  }


  processOrder() {
    const thisProduct = this;
      
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
      
    let price = thisProduct.data.price;
      
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      
      for(let optionId in param.options) {
        const option = param.options[optionId];

        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
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

    thisProduct.priceSingle = price;

    price *= thisProduct.amountWidget.value;
    thisProduct.dom.priceElem.innerHTML = price;
  }


  resetToDefault() {
    const thisProduct = this;
      
    thisProduct.dom.form.reset();

    thisProduct.amountWidget.setValue(settings.amountWidget.defaultValue); 
      
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      
      for(let optionId in param.options) {
        const option = param.options[optionId];

        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);

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

    thisProduct.dom.priceElem.innerHTML = thisProduct.data.price;
  }


  prepareCartProductParams() {
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    const params = {};
      
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

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
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    const paramsOnlyIds = {};
      
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

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
    const thisProduct = this;

    return {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
      paramsOnlyIds: thisProduct.prepareCartProductParamsOnlyIds(),
    };
  }


  addToCart() {
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      }
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;