TESTS AND TRIALS

/* Potrzebne zmienne */
const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
const optionNOTSelected = formData[paramId] && !formData[paramId].includes(optionId);

/* Wersja pierwsza - moja */
if (optionSelected && (!option.default)) {
  price += option.price;
} else if (optionNOTSelected && (option.default)) {
  price -= option.price;
}

if (optionSelected && optionImage) {
  optionImage.classList.add(classNames.menuProduct.imageVisible);
} else if (optionNOTSelected && optionImage) {
  optionImage.classList.remove(classNames.menuProduct.imageVisible);
} 

/* Wersja druga - kodillowa */
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