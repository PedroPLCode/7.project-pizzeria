class Carousel {
  constructor(element) { 
    this.getElements(element);
    setTimeout(() => {
      this.initPlugin();
    }, 500);
  }

  getElements(element) {
    this.dom = {
      carouselElement: element,
    };
  }

  initPlugin() {
    const options = {
      cellAlign: 'center', 
      contain: true,
      autoPlay: true,
      wrapAround: true,
      prevNextButtons: false,
      groupCells: '1',
    };
    // eslint-disable-next-line no-undef
    new Flickity(this.dom.carouselElement, options);
  }
}

export default Carousel;