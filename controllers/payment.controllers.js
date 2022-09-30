require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SK_TEST)


// get customer cards info
async function getCustomerCards(req, res, next){
    const { stripeUserId } = req.body;
    let cards = []
    
      const paymentMethods = await stripe.customers.listPaymentMethods(
        stripeUserId,
        {type: 'card'}
      );

    for(let i = 0; i < paymentMethods.data.length; i++){
        const card = {
            id: paymentMethods.data[i].id,
            brand: paymentMethods.data[i].card.brand,
            country: paymentMethods.data[i].card.country,
            exp_month: paymentMethods.data[i].card.exp_month,
            exp_year: paymentMethods.data[i].card.exp_year,
        }
        cards.push(card)
    }

      
    return cards
}
