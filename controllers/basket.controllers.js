const HttpError = require('../utils/http-error');
const Basket = require('../models/creation-basket')

const BasketModel = require('../models/creation-basket');

async function postBasket(req, res, next) {

    const { basketName, description, moneyGoal, expirationDate, isPublic, createdAt, currentValue } = req.body
    // const { id } = req.user;
    
    const Basket = {
        basketName, 
        description, 
        moneyGoal, 
        expirationDate, 
        isPublic, 
        createdAt, 
        currentValue,
        // userId: id
    }

    try {
        // await BasketModel(req.body).save()
        console.log(Basket);
    } catch (error) {
        return console.log(error);
    }
    return res
    .status(201)
    .json({ id: Basket._id, message: 'New Basket item created' });
}

module.exports = {postBasket}