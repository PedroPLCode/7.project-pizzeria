import {select, templates} from '../settings.js';
import {utils} from '../utils.js';
import {app} from '../app.js';
import Carousel from './Carousel.js';

class HomePage {
  constructor(element) { 
    this.render(element);
    this.getElements(element);
    this.initActions();
    this.initCarousel(this.dom.carouselElement);
  }

  render(element) {
    const generatedHTML = templates.homePage();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    element.appendChild(generatedDOM);
  }

  getElements(element) {
    this.dom = {
      wrapper: element,
      carouselElement: element.querySelector(select.containerOf.carousel),
      buttonsWrapper: element.querySelector(select.homePage.buttonsWrapper),
      buttonOrder: element.querySelector(select.homePage.buttonOrder),
      buttonBooking: element.querySelector(select.homePage.buttonBooking),
    };
  }

  initActions() {
    this.dom.buttonsWrapper.addEventListener('click', event => {
      let id = false;
      if (event.target == app.homePage.dom.buttonOrder ||
          event.target == app.homePage.dom.buttonBooking) {
        id = event.target.getAttribute('href');
        app.handleLinkClicked(id);
      } else if (event.target.parentNode == app.homePage.dom.buttonOrder ||
                 event.target.parentNode == app.homePage.dom.buttonBooking) {
        id = event.target.parentNode.getAttribute('href');
        app.handleLinkClicked(id);
      }
    })
  }

  initCarousel(carouselElement) {
    new Carousel(carouselElement);
  }
}

export default HomePage;