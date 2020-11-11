let db = require('../config/connection')
let collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { response } = require('express');
//rasorpay
const Razorpay = require('razorpay');

//Razorpay instance
var instance = new Razorpay({
    key_id: 'rzp_test_KWvH4bD4JuWd8e',
    key_secret: 'OtAd2W4oryEpXuuAOyrjSOux',
});

//object id declaration to compare(string converted to object)
var objectId = require('mongodb').ObjectID
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },

    //user Login 
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('login Success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Fail to login");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("Email Fail to login");
                resolve({ status: false })
            }
        })
    },

    //products add to cart
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                //    console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, {
                            $inc: { 'products.$.quantity': 1 }
                        }).then((response) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                // console.log(cartObj);
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    //select prodect from cart 
    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{proList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$proList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    //ChangeProductQuantity
    ChangeProductQuantity: ({ cart, product, count, quantity }) => {
        count = parseInt(count)
        quantity = parseInt(quantity)
        return new Promise((resolve, reject) => {

            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(cart) },
                        {
                            $pull: { products: { item: objectId(product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(cart), 'products.item': objectId(product) }, {
                        $inc: { 'products.$.quantity': count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },

    //get total amount
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] } }
                    }
                }
            ]).toArray()
            //  console.log(total);
            resolve(total[0].total)
        })
    },

    ///remove cart Item
    removeCartProduct: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(cartId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    }).catch(() => {
                        reject({ removeProduct: false })
                    })
        })
    },

    //place order
    placeOrder: (order, productsDetails, totalPrice) => {
        return new Promise((resolve, reject) => {
            // console.log(order,productsDetails,totalPrice);
            let status = order.paymentMethod === 'cod' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order.paymentMethod,
                products: productsDetails,
                totalPrice: totalPrice,
                status: status,
                date: new Date()
            }
            // console.log(orderObj);
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                // console.log('Order id from response : ' + response.ops[0]._id);
                resolve(response.ops[0]._id)
            })
        })
    },
    //getCartProductList
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    //get User Orders
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })
    },

    //get Ordered Products
    getOrderProducts: async (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        status: '$status',
                        item: '$products.item',
                        quantity: '$products.qauantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }, status: 1
                    }
                }
            ]).toArray()
            //  console.log(orderItems);
            resolve(orderItems)
        })
    },

    //generateRazorpay
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: parseInt(total)*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: objectId(orderId).toString()
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'OtAd2W4oryEpXuuAOyrjSOux');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymetStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })

        })
    }


    //end
}