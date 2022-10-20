const stripe = Stripe(
  'pk_test_51LlgddKPhPFjc58J31VCe6tDBvpabqjvZQ7caoM878BaF7QEpCGb3cnRBXpAp2ietjsbAQJRUV8RATlvdgT3qGlT00Il1uonIP',
);
const userName = document.getElementById('userName');
const description = document.getElementById('comment');
const amount = document.getElementById('amount');
const paymentForm = document.getElementById('payment-form');
const form = document.getElementById('form');

const setDonateAmount = count => {
  amount.value = +amount.value + count;
};

let price = '';
const changeValue = e => {
  const newValue = event.target.value;

  if (!newValue) {
    price = newValue;
    return;
  }
  const newPrice = e.target.value.match(/^(\d+([.,])?\d{0,2})$/g);

  if (newPrice !== null) {
    price = newPrice;
  }

  event.target.value = price;
};

let elements;

checkStatus();
initialize();

form?.addEventListener('submit', e => {
  e.preventDefault();

  localStorage.setItem(
    'clientInfo',
    JSON.stringify({
      userName: userName.value,
      amount: Number(amount.value),
      description: description.value,
    }),
  );

  window.location.href = '/basket/create-payment-intent';
});
document
  .querySelector('#payment-form')?.addEventListener('submit', handleSubmit);

async function initialize() {
  const clientInfo = localStorage.getItem('clientInfo');
  const info = JSON.parse(clientInfo);
  const response = await fetch('/basket/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: info.amount,
      description: info.description,
      userName: info.userName,
    }),
  });
  const { clientSecret } = await response.json();
  const appearance = {
    theme: 'stripe',
  };

  elements = stripe.elements({ clientSecret });

  const paymentElement = elements.create('payment', {
    clientSecret,
    appearance,
  });
  paymentElement.mount('#payment-element');
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: 'http://localhost:5050/basket/success/:param',
    },
  });

  if (error.type === 'card_error' || error.type === 'validation_error') {
    showMessage(error.message);
  } else {
    showMessage('An unexpected error occurred.');
  }

  setLoading(false);
}

async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret',
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case 'succeeded':
      showMessage('Payment succeeded!');
      break;
    case 'processing':
      showMessage('Your payment is processing.');
      break;
    case 'requires_payment_method':
      showMessage('Your payment was not successful, please try again.');
      break;
    default:
      showMessage('Something went wrong.');
      break;
  }
}

function showMessage(messageText) {
  const messageContainer = document.querySelector('#payment-message');

  messageContainer.classList.remove('hidden');
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add('hidden');
    messageText.textContent = '';
  }, 4000);
}

function setLoading(isLoading) {
  if (isLoading) {
    document.querySelector('#submit').disabled = true;
    document.querySelector('#spinner').classList.remove('hidden');
    document.querySelector('#button-text').classList.add('hidden');
  } else {
    document.querySelector('#submit').disabled = false;
    document.querySelector('#spinner').classList.add('hidden');
    document.querySelector('#button-text').classList.remove('hidden');
  }
}
