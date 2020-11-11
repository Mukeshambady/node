
var express = require('express');
var router = express.Router();
const usersHelper = require('../helpers/users-helpers');
const productHelper = require('../helpers/product-helpers');
const { Db } = require('mongodb');
const { response } = require('express');

//middileware useed to check lgged In or Not
const verifyLogin = (req, res, next) => {
 
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

async function cartCount(userId) {
  let cartCount = 0
  if (userId) {
    cartCount = await usersHelper.getCartCount(userId)
  }

  return cartCount
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cart_count=0
  if(user){
     cart_count = await cartCount(user._id)
  }
  
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user,cart_count });
  })
});

/* GET Login page. */
router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.loginError })
    req.session.loginError = false
  }

})

/* GET Logout page. and session distroy*/
router.get('/logout', (req, res) => {
  req.session.loggiedIn = false
  req.session.destroy()
  res.redirect('/')
})

/* GET signup page. */
router.get('/signup', (req, res) => {
  res.render('user/signup')
})

/* POST signup page. */
router.post('/signup', (req, res) => {
  usersHelper.doSignup(req.body).then((response) => {
    //console.log(response);
    req.session.user = response.user
    req.session.userLoggedIn = true
    res.redirect('/')
  })
})

/* POST Login page. */
router.post('/login', (req, res) => {
  usersHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      res.redirect('/')//calling the Home page
    } else {
      req.session.loginError = true
      res.redirect('/login')
    }
  })
})

//Display  Cart
router.get('/cart', verifyLogin, async (req, res) => {
  let total = 0
  let products = await usersHelper.getCartProducts(req.session.user._id)
  let cart_count = await cartCount(req.session.user._id)
  if (products.length > 0) {
    total = await usersHelper.getTotalAmount(req.session.user._id)
  }
  res.render('user/cart', { products, user: req.session.user, cart_count, total })
})

//add product to Cart by ajax
router.get('/add-to-cart/:id', (req, res) => {
  usersHelper.addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json({ status: true })
  })
})

//Ajax
//run time quantity incriment or decriment using AJAX
router.post('/change-product-quantity', (req, res) => {
  usersHelper.ChangeProductQuantity(req.body).then(async (response) => {
    response.total = await usersHelper.getTotalAmount(req.body.userId)
    res.json(response)
  })
})
//place-order
router.get('/place-order', verifyLogin, async (req, res, next) => {
  let total = await usersHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})

//Ajax
//Remove cart product item
router.post('/remove-cart-item', async (req, res, next) => {
  let result = await usersHelper.removeCartProduct(req.body.cartId, req.body.proId)
  res.json(result)
})

//ajax 
//Place order
router.post('/place-order', async (req, res) => {
  let products = await usersHelper.getCartProductList(req.body.userId)
  let totalPrice = await usersHelper.getTotalAmount(req.body.userId)
  usersHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['paymentMethod' === 'cod']) {
      res.json({ codSuccess: true })
    } else {
      usersHelper.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })
  //  console.log(req.body);
})

//ajax
//success page
router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

//orders List
router.get('/orders', verifyLogin, async (req, res, next) => {
  let orders = await usersHelper.getUserOrders(req.session.user._id)
  // console.log(orders);
  res.render('user/orders', { user: req.session.user, orders })
})

//View Order Products
router.get('/view-order-products/:id', verifyLogin, async (req, res, next) => {
  let products = await usersHelper.getOrderProducts(req.params.id)
  // console.log(products);
  res.render('user/view-order-products', { user: req.session.user, products })
})

//Ajax
///verify-payment
router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  usersHelper.verifyPayment(req.body).then((response) => {
    console.log(('Payment Successful'));
    usersHelper.changePaymetStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: '' })
  })
})

module.exports = router;
