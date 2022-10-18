const { validationResult } = require('express-validator');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const HttpError = require('../utils/http-error');

const Basket = require('../models/basket.model');
const Participants = require('../models/participant.model');

const { createCustomer } = require('../services/stripe/create-customer.service')

const onePageLimit = 12;

const getOrderArgs = (order) => {
    switch(order) {
        case "Newest to oldest": return { creationDate: -1, _id: 1 };
        case "Oldest to newest": return { creationDate: 1, _id: 1 };
        case "Expensive to cheap": return { goal: -1, _id: 1 };
        case "Cheap to expensive": return { goal: 1, _id: 1 };
        case "Soon to expire": return { expirationDate: 1, _id: 1 };
        case "Far to expire": return { expirationDate: -1, _id: 1 };
    }
    return '';
}

async function getOwnerBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;
    
    const bottomIndex = (page - 1) * onePageLimit;

    const ownerBasketCount = await Basket.countDocuments({ ownerId: ObjectId(id) });

    const baskets = await Basket
        .find({ ownerId: id })
        .sort(getOrderArgs(order))
        .skip(bottomIndex)
        .limit(onePageLimit);

    res.status(200).json({
        basketData: [...baskets], 
        paginationData: { maxPageAmount: Math.ceil(ownerBasketCount / onePageLimit) }
    });
}

async function getCoownerBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;

    const coownerBasketCount = await Participants.countDocuments({ user: ObjectId(id) });

    const baskets = await Participants.aggregate([
        { $match: { user: ObjectId(id) } },
        { $lookup: 
            { 
                from: 'baskets',
                localField: 'basket',
                foreignField: '_id',
                as: 'basket'
            } 
        },
        { $replaceWith: { $first: "$basket" } },
        { $sort: getOrderArgs(order) },
        { $skip: bottomIndex },
        { $limit: onePageLimit }
    ])
    
    res.status(200).json({
        basketData: [...baskets], 
        paginationData: { maxPageAmount: Math.ceil(coownerBasketCount / onePageLimit) }
    });
}

async function getPublicBaskets(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerBasketCount = await Basket.countDocuments({ ownerId: ObjectId(id), isPublic: true });
    const coownerBasketCount = await 
        Participants.find({ user: ObjectId(id) })
        .populate('basket')
        .where('basket.isPublic')
        .equals(true)
        .countDocuments();

    const totalBasketCount = ownerBasketCount + coownerBasketCount;

    const baskets = await Basket.aggregate([
        { $match: { ownerId: ObjectId(id), isPublic: true } },
        { 
            $unionWith: { 
                coll: 'participants', 
                pipeline: [ 
                    { $match: { user: ObjectId(id) } },
                    { $lookup: 
                        { 
                            from: 'baskets',
                            localField: 'basket',
                            foreignField: '_id',
                            as: 'basket'
                        } 
                    },
                    { $replaceWith: { $first: "$basket" } },
                    { $match: { isPublic: true } } 
                ] 
            } 
        },
        { $sort: getOrderArgs(order) },
        { $skip: bottomIndex },
        { $limit: onePageLimit }
    ])

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
    
    const ownerBasketCount = await Basket.countDocuments({ ownerId: ObjectId(id), isPublic: false });
    const coownerBasketCount = await 
        Participants.find({ user: ObjectId(id) })
        .populate('basket')
        .where('basket.isPublic')
        .equals(false)
        .countDocuments();
    const totalBasketCount = ownerBasketCount + coownerBasketCount;

    const baskets = await Basket.aggregate([
        { $match: { ownerId: ObjectId(id), isPublic: false } },
        { 
            $unionWith: { 
                coll: 'participants', 
                pipeline: [ 
                    { $match: { user: ObjectId(id) } },
                    { $lookup: 
                        { 
                            from: 'baskets',
                            localField: 'basket',
                            foreignField: '_id',
                            as: 'basket'
                        } 
                    },
                    { $replaceWith: { $first: "$basket" } },
                    { $match: { isPublic: false } } 
                ] 
            } 
        },
        { $sort: getOrderArgs(order) },
        { $skip: bottomIndex },
        { $limit: onePageLimit }
    ])

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

    let stripeId;

    try{
        stripeId = await createCustomer({ email:'', firstName: req.body.basketName, lastName: 'Basket' })
    }catch(err){
        return next(new HttpError(`Error when creating a basket appeared. Message: ${err.message}`, 500));
    }

    let basket;
    try{
        basket = await Basket.create({
            ownerId: req.user._id,
            name: req.body.basketName,
            description: req.body.description,
            goal: req.body.moneyGoal,
            value: 0,
            expirationDate: req.body.expirationDate,
            isPublic: req.body.isPublic,
            creationDate: +new Date(),
            image: req.body.photoTag,
            stripeId
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

async function getBasketById(req, res, next) {
    const { id } = req.query;
    
    let basket = {};

    try{
        basket = await Basket.findById(id).populate('ownerId');
    } catch (err){
        return next(new HttpError(`No basket with ${id} id exists`, 500));
    }

    res.status(200).json({ basket: basket });
}

module.exports = { 
    getOwnerBaskets, 
    getCoownerBaskets, 
    getPublicBaskets, 
    getPrivateBaskets, 
    createBasket,
    updateBasket, 
    deleteBasket,
    getBasketById 
}