const { validationResult } = require('express-validator');
const HttpError = require('../utils/http-error');

const Basket = require('../models/basket.model');
const Participants = require('../models/participant.model');

const onePageLimit = 5;

const getOrderArgs = (order) => {
    switch(order) {
        case "Newest to oldest": return "creationDate";
        case "Oldest to newest": return "-creationDate";
        case "Expensive to cheap": return "-goal";
        case "Cheap to expensive": return "goal";
        case "Soon to expire": return "expirationDate";
        case "Far to expire": return "-expirationDate";
    }
    return '';
}

async function getOwnerBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;
    
    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerBasketCount = await Basket.countDocuments({ ownerId: id });

    const baskets = await 
        Basket.find({ ownerId: id })
        .sort(getOrderArgs(order))
        .skip(bottomIndex)
        .limit(onePageLimit) 

    res.status(200).json({
        basketData: baskets, 
        paginationData: { maxPageAmount: Math.ceil(ownerBasketCount / onePageLimit) }
    });
}

async function getCoownerBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;

    const coownerBasketCount = await Participants.countDocuments({ user: id });

    const baskets = (await Participants.find({ user: id }).sort(getOrderArgs(order)).skip(bottomIndex).limit(onePageLimit) 
        .populate('basket'))
        .map((doc) => { return doc.basket });
    
    res.status(200)
        .json({
            basketData: baskets, 
            paginationData: { maxPageAmount: Math.ceil(coownerBasketCount / onePageLimit)}
        });
}

async function getPublicBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerBasketCount = await Basket.countDocuments({ ownerId: id, isPublic: true });
    const coownerBasketCount = await 
        Participants.find({ user: id })
        .populate('basket')
        .where('basket.isPublic')
        .equals(true)
        .countDocuments();

    const totalBasketCount = ownerBasketCount + coownerBasketCount;

    let ownerBaskets = [];
    let coownerBaskets = [];

    if(bottomIndex < ownerBasketCount){
        const requestedOwnerBasketAmount = Math.min(ownerBasketCount - bottomIndex, onePageLimit);
        
        // can be changed a little bit (requestedOwnerBasketAmount => onePageLimit), tho it will not make any difference at all
        ownerBaskets = await 
            Basket.find({ ownerId: id, isPublic: true })
            .sort(getOrderArgs(order))
            .skip(bottomIndex)
            .limit(requestedOwnerBasketAmount);

        if(requestedOwnerBasketAmount < onePageLimit) {
            coownerBaskets = (await 
                Participants.find({ user: id })
                .populate('basket')
                .where('basket.isPublic')
                .equals(true)
                .sort(getOrderArgs(order))
                .limit(onePageLimit - requestedOwnerBasketAmount)
                ).map((doc) => { return doc.basket });
        }
    }
    else{
        coownerBaskets = (await 
            Participants.find({ user: id })
            .populate('basket')
            .where('basket.isPublic')
            .equals(true)
            .sort(getOrderArgs(order))
            .skip(bottomIndex - ownerBasketCount)
            .limit(onePageLimit)
            ).map((doc) => { return doc.basket });
    }

    const baskets = [...ownerBaskets, ...coownerBaskets];

    res.status(200)
        .json({
            basketData : [...baskets], 
            paginationData: { maxPageAmount: Math.ceil(totalBasketCount / onePageLimit)}
        })
}

async function getPrivateBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerBasketCount = await Basket.countDocuments({ ownerId: id, isPublic: false });
    const coownerBasketCount = await 
        Participants.find({ user: id })
        .populate('basket')
        .where('basket.isPublic')
        .equals(false)
        .countDocuments();
    const totalBasketCount = ownerBasketCount + coownerBasketCount;

    let ownerBaskets = [];
    let coownerBaskets = [];

    if(bottomIndex < ownerBasketCount){
        const requestedOwnerBasketAmount = Math.min(ownerBasketCount - bottomIndex, onePageLimit);
        
        // can be changed a little bit (requestedOwnerBasketAmount => onePageLimit), tho it will not make any difference at all
        ownerBaskets = await 
            Basket.find({ ownerId: id, isPublic: false })
            .sort(getOrderArgs(order))
            .skip(bottomIndex)
            .limit(requestedOwnerBasketAmount) 

        if(requestedOwnerBasketAmount < onePageLimit) {
            coownerBaskets = (await 
                Participants.find({ user: id })
                .populate('basket')
                .where('basket.isPublic')
                .equals(false)
                .sort(getOrderArgs(order))
                .limit(onePageLimit - requestedOwnerBasketAmount)
                ).map((doc) => { return doc.basket });
        }
    }
    else{
        coownerBaskets = (await 
            Participants.find({ user: id })
            .populate('basket')
            .where('basket.isPublic')
            .equals(false)
            .sort(getOrderArgs(order))
            .skip(bottomIndex - ownerBasketCount)
            .limit(onePageLimit)
            ).map((doc) => { return doc.basket });
    }

    const baskets = [...ownerBaskets, ...coownerBaskets];

    res.status(200)
        .json({
            basketData : [...baskets], 
            paginationData: { maxPageAmount: Math.ceil(totalBasketCount / onePageLimit)} 
        })
}


async function createBasket(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid or not all inputs passed.', 422));
    }

    let basket;

    try{
        basket = await Basket.create({
            ownerId: req.user._id,
            name: req.body.name,
            description: req.body.description,
            goal: req.body.goal,
            value: 0,
            expirationDate: req.body.expirationDate,
            isPublic: req.body.isPublic,
            creationDate: Date.now(),
            image: req.body.image
        })
    }
    catch (error){
        return next(new HttpError(`Error when creating a basket appeared. Message: ${error.message}`, 500));
    }

    res.status(201).json({ id: basket._id, message: "Successfully created a basket." });
}

async function updateBasket(req, res, next) {

}

async function deleteBasket(req, res, next) {
    //const id = req.params.id;

    //const deleted = Basket.deleteOne({ _id: id })

} 

module.exports = { 
    getOwnerBaskets, 
    getCoownerBaskets, 
    getPublicBaskets, 
    getPrivateBaskets, 
    createBasket,
    updateBasket, 
    deleteBasket 
}