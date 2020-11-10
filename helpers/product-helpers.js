var db = require('../config/connection')
var collection = require('../config/collections');
const { Logger } = require('mongodb');
const collections = require('../config/collections');
const { response } = require('express');

//object id declaration to compare(string converted to object)
var objectId = require('mongodb').ObjectID

module.exports = {

    //using callback functionality
    addProduct: (product, callback) => {
        // console.log(product);

        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.ops[0]._id)
        })
    },

    //using promise functionality
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },

    //getProductDetails
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },

    //update Product
    updateProduct: (proId, ProDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        name: ProDetails.name,
                        description: ProDetails.description,
                        category: ProDetails.category,
                        price: ProDetails.price
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }





}