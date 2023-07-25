/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
      message: '.cart__message',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
      wrapperError: 'error',
    },
  };

  const messages = {
    error: {
      address: ['WARNING.', 'Please provide correct address.', 'At least 6 characters.'],
      phone: ['WARNING.', 'Please provide correct number.', '9 digits.'],
      cart: ['WARNING.', 'Cart looks empty.', 'Please put some products.'],
      notSent: ['ERROR. ORDER NOT SENT.'],
    },
    confirmation: ['ORDER CONFIRMATION.', 'Order sent successfully.', 'Please wait for delivery.'], 
  }
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };


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


    prepareCartProduct() {
      const thisProduct = this;

      return {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };
    }


    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
  }


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
        thisWidget.setValue(thisWidget.dom.input.value);
      });

      thisWidget.dom.linkDecrease.addEventListener('click', function(value) {
        value.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.dom.linkIncrease.addEventListener('click', function(value) {
        value.preventDefault();
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


  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
    }


    getElements(element) {
      const thisCart = this;

      thisCart.dom = {
        wrapper: element,
        toggleTrigger: element.querySelector(select.cart.toggleTrigger),
        productList: document.querySelector(select.containerOf.cart),
        deliveryFee: element.querySelector(select.cart.deliveryFee),
        subtotalPrice: element.querySelector(select.cart.subtotalPrice),
        totalPrice: element.querySelectorAll(select.cart.totalPrice),
        totalNumber: element.querySelector(select.cart.totalNumber),
        form: element.querySelector(select.cart.form),
        address: element.querySelector(select.cart.address),
        phone: element.querySelector(select.cart.phone),
      };
    }


    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function() {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(event) {
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event) {
        event.preventDefault();
        app.api.sentOrder();
      });

      thisCart.dom.address.addEventListener('change', function() {
        thisCart.dom.address.classList.add(classNames.cart.wrapperError);
        thisCart.clearMessages();
        thisCart.printMessage(messages.error.address);
        if (thisCart.dom.address.value.length >= 6) {
          thisCart.dom.address.classList.remove(classNames.cart.wrapperError);
          thisCart.clearMessages();
        }
      });

      thisCart.dom.phone.addEventListener('change', function() {
        thisCart.dom.phone.classList.add(classNames.cart.wrapperError);
        thisCart.clearMessages();
        thisCart.printMessage(messages.error.phone);
        if (thisCart.dom.phone.value.length == 9) {
          thisCart.dom.phone.classList.remove(classNames.cart.wrapperError);
          thisCart.clearMessages();
        }
      });
    }


    add(menuProduct) {
      const thisCart  = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      const cartContainer = document.querySelector(select.cart.productList);
      cartContainer.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.clearMessages();

      thisCart.update();
    }


    update() {
      const thisCart  = this;

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let singleProduct of thisCart.products) {
        thisCart.totalNumber += singleProduct.amount;
        thisCart.subtotalPrice += singleProduct.price;
      }

      if (!thisCart.products.length) {
        thisCart.deliveryFee = 0;
      }

      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

      for (let singleTotalPrice of thisCart.dom.totalPrice) {
        singleTotalPrice.innerHTML = thisCart.totalPrice;
      }
    }


    remove(productToRemove) {
      const thisCart = this;

      productToRemove.dom.wrapper.remove();

      const indexToRemove = thisCart.products.indexOf(productToRemove);
      thisCart.products.splice(indexToRemove, 1);

      thisCart.update();
    }


    printMessage(msgs) {

      for (let msg of msgs) {
        let div = document.createElement('div');
        div.innerHTML = msg;
        document.querySelector(select.cart.message).appendChild(div);
      }
    }
    

    clearMessages() {
      document.querySelector(select.cart.message).innerHTML = '';
    } 
  

    validate(payload) {
      const thisCart = this;
      thisCart.clearMessages();

      if (payload.products.length != 0) {
        thisCart.clearMessages();
        if (payload.phone.length == 9) {
          thisCart.dom.phone.classList.remove(classNames.cart.wrapperError);
          thisCart.clearMessages();
          if (payload.address.length >= 6) {
            thisCart.dom.address.classList.remove(classNames.cart.wrapperError);
            thisCart.clearMessages();
            return true;
          } else {
            thisCart.dom.address.classList.add(classNames.cart.wrapperError);
            thisCart.clearMessages();
            thisCart.printMessage(messages.error.address);
          }
        } else {
          thisCart.clearMessages();
          thisCart.printMessage(messages.error.phone);
          thisCart.dom.phone.classList.add(classNames.cart.wrapperError);
        }
      } else {
        thisCart.clearMessages();
        thisCart.printMessage(messages.error.cart);
      }
    }


    resetToDefault() {
      const thisCart = this;

      for (let singleProduct of thisCart.products) {
        singleProduct.dom.wrapper.remove();
      }

      thisCart.products = [];

      thisCart.update();
    } 
  }


  class API {

    getData() {
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url) 
      .then(function(rawResponse) {
        return rawResponse.json();
      })
      .then(function(parsedResponse) {
        app.data.products = parsedResponse;

        app.initMenu();
      });
    }


    sentOrder() {
      const thisAPI = this;

      const url = settings.db.url + '/' + settings.db.orders;

      thisAPI.payload = {
        address: app.cart.dom.address.value,
        phone: app.cart.dom.phone.value,
        totalPrice: app.cart.totalPrice,
        subtotalPrice: app.cart.subtotalPrice,
        totalNumber: app.cart.totalNumber,
        deliveryFee: app.cart.deliveryFee,
        products: [],
      };

      for(let prod of app.cart.products) {
        thisAPI.payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thisAPI.payload),
      };
      
      if (app.cart.validate(thisAPI.payload)) {
        fetch(url, options)
        .then(function(response) {
          return response.json();
        })
        .then(function(parsedResponse) {
          console.log('parsed response - sentOrder', parsedResponse);
          thisAPI.orderSentOK();
        })
        .catch((error) => {
          thisAPI.handleError(error);
        });
      } 
    } 


    orderSentOK() {
      app.cart.resetToDefault();

      const activeProduct = document.querySelector(select.all.menuProductsActive);
      activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        
      app.cart.clearMessages();
      app.cart.printMessage(messages.confirmation);
    }


    handleError(errorCode) {
      app.cart.clearMessages();
      messages.error.notSent.push(errorCode);
      app.cart.printMessage(messages.error.notSent);
      messages.error.notSent.pop();
    }
  }


  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.id = menuProduct.id;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget(thisCartProduct.amount);
      thisCartProduct.initActions();
    }

    
    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {
        wrapper: element,
        amountWidget: element.querySelector(select.cartProduct.amountWidget),
        price: element.querySelector(select.cartProduct.price),
        edit: element.querySelector(select.cartProduct.edit),
        remove: element.querySelector(select.cartProduct.remove),
      };
    }


    initAmountWidget(amount) {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.amountWidget.setValue(amount);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function(event){
        event.preventDefault();

        const amount = thisCartProduct.amountWidget.value;
        const price = thisCartProduct.priceSingle;

        thisCartProduct.amount = amount;
        thisCartProduct.price = amount * price;

        thisCartProduct.dom.price.innerHTML = price * amount;
      });
    }


    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener('click', function(event) {
        event.preventDefault();

        thisCartProduct.remove();
      });
    }


    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }


    getData() {
      const thisCartProduct = this;

      return {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      }
    }
  }


  const app = {
    initMenu: function() {
      const thisApp = this;

      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function() {
      const thisApp = this;
      thisApp.data = {};
      thisApp.api = new API();
      thisApp.api.getData();
    },

    initCart: function() {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
