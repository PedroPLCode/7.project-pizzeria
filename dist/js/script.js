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
    },
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
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

        //Zwijanie koszyka gru klikniemy w produkt
        //app.cart.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
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

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
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
      };
    }


    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        
        //Zwijanie produktów gdy klikniemy w koszyk
        //const activeProduct = document.querySelector(select.all.menuProductsActive);
        //activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function() {
        thisCart.update();
      });
    }


    add(menuProduct) {
      const thisCart  = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      const cartContainer = document.querySelector(select.containerOf.cart);
      cartContainer.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.update();
    }


    update() {
      const thisCart  = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0, subtotalPrice = 0;

      for (let singleProduct of thisCart.products) {
        totalNumber += singleProduct.amount;
        subtotalPrice += singleProduct.price;
      }

      if (thisCart.products) {
        thisCart.totalPrice = subtotalPrice + deliveryFee;
      }

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.totalNumber.innerHTML = totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;

      for (let singleTotalPrice of thisCart.dom.totalPrice) {
        singleTotalPrice.innerHTML = thisCart.totalPrice;
      }
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
  }


  const app = {
    initMenu: function() {
      const thisApp = this;

      for (let productData in thisApp.data.products) {
        new Product (productData, thisApp.data.products[productData]);
      }
    },

    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initCart: function() {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
