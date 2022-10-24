const stripe = Stripe(publicKey);
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

if (paymentForm) {
  initialize();
}

checkStatus();

form?.addEventListener('submit', e => {
  e.preventDefault();
  validateInputs();
  const id = window.location.href;
  const basketId = id.split('/').slice(-1)[0];

  if (userName.value && amount.value) {
    localStorage.setItem('basketId', basketId);

    localStorage.setItem(
      'clientInfo',
      JSON.stringify({
        userName: userName.value,
        amount: Number(amount.value),
        description: description.value,
        basketId: basketId,
      }),
    );
    window.location.href = '/basket/create-payment-intent';
  }
});

const input = [userName, amount];

input.forEach(input => {
  input?.addEventListener('focus', () => {
    setSuccess(input);
  });
});

function setError(input, message) {
  const formControl = input.parentElement;
  const errorInput = formControl.querySelector('input');
  errorInput.className = 'error_input';
  const label = formControl.querySelector('label');
  label.innerText = message;
}

function setSuccess(input) {
  const formControl = input.parentElement;
  const label = formControl.querySelector('label');
  label.innerText = '';
  const errorInput = formControl.querySelector('input');
  errorInput.classList.remove('error_input');
}

const validateInputs = () => {
  const amountValue = amount.value.trim();
  const userNameValue = userName.value.trim();

  if (amountValue === '') {
    setError(amount, 'Amount is required');
  } else {
    setSuccess(amount);
  }

  if (userNameValue === '') {
    setError(userName, 'Name is required');
  } else {
    setSuccess(userName);
  }
};

document
  .querySelector('#payment-form')
  ?.addEventListener('submit', handleSubmit);

async function initialize() {
  const clientInfo = localStorage.getItem('clientInfo');
  const info = JSON.parse(clientInfo);

  const calculateAmount = info.amount * 100;

  const response = await fetch('/api/payment/share-bank-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: calculateAmount,
      description: info.description,
      userName: info.userName,
    }),
  });
  const { clientSecret, paymentIntentId } = await response.json();
  const appearance = {
    theme: 'stripe',
  };
  localStorage.setItem('paymentId', paymentIntentId);
  if (clientSecret && paymentForm) {
    elements = stripe.elements({ clientSecret });

    const paymentElement = elements.create('payment', {
      clientSecret,
      appearance,
    });
    paymentElement.mount('#payment-element');
  }
}
async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${apiHost}/basket/success/:param`,
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
      const key = localStorage.getItem('paymentId');
      const basketId = localStorage.getItem('basketId');
      await fetch('/api/payment/share-bank-donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: basketId,
          paymentIntentId: key,
          paymentIntent: paymentIntent,
        }),
      });

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

  messageContainer?.classList.remove('hidden');
  messageContainer?.textContent = messageText;

  setTimeout(function () {
    messageContainer?.classList.add('hidden');
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
