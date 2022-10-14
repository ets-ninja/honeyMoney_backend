const form = document.getElementById('form');
const input = document.getElementById('money_input');
const comment = document.getElementById('comment');

form.addEventListener('submit', e => {
  e.preventDefault();
});

let price = '';
const changeValue = e => {
  const newValue = event.target.value;

  if (!newValue) {
    price = newValue;
    return;
  }
  const newPrice = e.target.value.match(/^(\d+([.,])?\d{0,2})$/g);
  // const newPrice = e.target.value.match(/(0|[1-9]\d*)([.]\d+)?/);


  if (newPrice !== null ) {
    price = newPrice;
  }

  event.target.value = price;
};

const setDonateAmount = count => {
  input.value = +input.value + count;
};
