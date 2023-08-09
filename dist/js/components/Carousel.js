class Carousel {
  constructor(element) { 
    this.getElements(element)
    this.initPlugin();
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
    const carousel = new Flickity(this.dom.carouselElement, options);
    console.log(carousel);
  }
}

export default Carousel;