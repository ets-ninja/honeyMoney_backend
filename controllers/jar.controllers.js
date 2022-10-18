const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const HttpError = require('../utils/http-error');

const Jar = require('../models/jar.model');
const Participants = require('../models/participant.model');

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

async function getOwnerJars(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;
    
    const bottomIndex = (page - 1) * onePageLimit;

    const ownerJarCount = await Jar.countDocuments({ ownerId: ObjectId(id) });

    let jars;
    try {
      jars = await Jar
        .find({ ownerId: id })
        .sort(getOrderArgs(order))
        .skip(bottomIndex)
        .limit(onePageLimit);
    } catch(error){
        const err = new HttpError(`Error with recieving jars. Message: ${error.message}`, 500);
        return next(err);
    }

    res.status(200).json({
        basketData: [...jars], 
        paginationData: { maxPageAmount: Math.ceil(ownerJarCount / onePageLimit) }
    });
}

async function getCoownerJars(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;

    const coownerJarCount = await Participants.countDocuments({ user: ObjectId(id) });

    let jars;
    try{
        jars = await Participants.aggregate([
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
    } catch (error) {
        return next(error);
    }
    
    res.status(200).json({
        basketData: [...jars], 
        paginationData: { maxPageAmount: Math.ceil(coownerJarCount / onePageLimit) }
    });
}

async function getPublicJars(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerJarCount = await Jar.countDocuments({ ownerId: ObjectId(id), isPublic: true });
    const coownerJarCount = await 
        Participants.find({ user: ObjectId(id) })
        .populate('basket')
        .where('basket.isPublic')
        .equals(true)
        .countDocuments();

    const totalJarCount = ownerJarCount + coownerJarCount;

    let jars;
    try {
        jars = await Jar.aggregate([
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
    } catch (error){
        return next(error);
    }

    res.status(200)
        .json({
            basketData : [...jars], 
            paginationData: { maxPageAmount: Math.ceil(totalJarCount / onePageLimit)}
        })
}

async function getPrivateJars(req, res, next) {
    const { id } = req.user;
    const { page, order } = req.query;

    const bottomIndex = (page - 1) * onePageLimit;
    
    const ownerJarCount = await Jar.countDocuments({ ownerId: ObjectId(id), isPublic: false });
    const coownerJarCount = await 
        Participants.find({ user: ObjectId(id) })
        .populate('basket')
        .where('basket.isPublic')
        .equals(false)
        .countDocuments();
    const totalJarCount = ownerJarCount + coownerJarCount;

    let jars;
    try {
        jars = await Jar.aggregate([
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
    } catch (error) {
        return next(error);
    }

    res.status(200)
        .json({
            basketData : [...jars], 
            paginationData: { maxPageAmount: Math.ceil(totalJarCount / onePageLimit)} 
        })
}


async function createBasket(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid or not all inputs passed.', 422));
    }

    let basket;

    try{
        basket = await Jar.create({
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

async function updateJar(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed.', 422));
    }

    const { id, name, expirationDate, description, goal } = req.body;

    const updatedJar = {
        ...(name && { name }),
        ...(goal && { goal }),
        ...(expirationDate && { expirationDate }),
        ...(description && { description }),
    }

    let existingJar;
    try {
        existingJar = await Jar.findOneAndUpdate(
        { _id: id },
        updatedJar,
        { new: true },
      ).select('-image -ownerId');
    } catch (err) {
      const error = new HttpError(
        'Updating failed, please try again later.',
        500,
      );
      return next(error);
    }
  
    res.status(200).json({
      jar: existingJar,
      message: 'Jar data updated',
    });
}

async function deleteJar(req, res, next) {
    //const id = req.params.id;

    //const deleted = Basket.deleteOne({ _id: id })

} 

async function getJarById(req, res, next) {
    const { id } = req.query;
    
    let jar = {};

    try{
        jar = await Jar.findById(id).populate('ownerId');
    } catch (err){
        return next(new HttpError(`No jar with ${id} id exists`, 500));
    }

    res.status(200).json({ basket: jar });
}

module.exports = { 
    getOwnerJars, 
    getCoownerJars, 
    getPublicJars, 
    getPrivateJars, 
    createBasket,
    updateJar, 
    deleteJar,
    getJarById 
}