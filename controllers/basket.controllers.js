const HttpError = require('../utils/http-error');
const Basket = require('../models/creation-basket')

const BasketModel = require('../models/creation-basket');

async function postBasket(req, res, next) {

    const { basketName, description, moneyGoal, expirationDate, isPublic, createdAt } = req.body
    const { id } = req.user;
    
    const newBasket = {
        basketName, 
        description, 
        moneyGoal, 
        expirationDate, 
        isPublic, 
        createdAt, 
        userId: id
    }

    try {
        // await BasketModel(req.body).save()
        console.log(newBasket);
    } catch (error) {
        return console.log(error);
    }
    return res
    .status(201)
    .json({ id: Basket._id, message: 'New Basket item created' });
}

module.exports = {postBasket}