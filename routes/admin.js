var express = require('express');
const { route } = require('./admin');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const { response } = require('express');
const { ReplSet } = require('mongodb');


//middileware useed to check lgged In or Not
const verifyLogin = (req, res, next) => {

  if (req.session.adminLoginedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}
/* GET Logout page. and session distroy*/
router.get('/logout', (req, res) => {
  req.session.adminLoginedIn = null
  req.session.destroy()
  res.redirect('/admin/login')
})

//admin Login get page
router.get('/login',(req,res)=>{  
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', {layout: false,'loginErr': req.session.asminLoginError });
    req.session.adminLoginError = false
  }
})

/* POST Login page. */
router.post('/login', (req, res) => {
  console.log(req.body);
  if(req.body.email === 'admin@gmail.com' && req.body.password === '1234' ){
    req.session.admin = {name:'admin',_id:0}
        req.session.req.session.adminLoginedIn = true
        req.session.adminLoginError = false
        res.redirect('/admin')//calling the Home page
  }else{
    req.session.adminLoginError = true
    res.redirect('admin/login')
  }
 
})
//************************************************************************ */

/* GET home page. */
router.get("/",verifyLogin, function (req, res,next) {

  productHelper.getAllProducts().then((products) => {
   //let admin=req.session.admin
    let admin =req.session.admin

    res.render('admin/view-products', { title: "Shoping - Cart", products,  admin })
  })
})

router.get('/add-product', (req, res) => {
  let admin=req.session.admin 
  res.render('admin/add-product', {  admin })
})

//add one product
router.post('/add-product', (req, res) => {
  productHelper.addProduct(req.body, (id) => {
    //get image file from Form
    let image = req.files.image
    //move image into public/product-images with image name as _id
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { result: true })
      } else {
        console.log(err);
      }
    })

  })
})

//delete product
router.get('/delete-product/:id', (req, res) => {
  productHelper.deleteProduct(req.params.id)
  res.redirect('/admin')
})

//edit page get
router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product', { product })
})

//edit page POST
router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelper.updateProduct(id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.image) {
      //get image file from Form
      let image = req.files.image
      //move image into public/product-images with image name as _id
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})


///view  all-orders
router.get('/all-orders',verifyLogin, (req, res) => {
  let admin =req.session.admin
  productHelper.viewAllorders().then((orders)=>{
   res.render('admin/view-all-orders',{orders,admin})
  })
})

///all-users
///view  all-orders
router.get('/all-users', (req, res) => {
 
  productHelper.demo().then((orders)=>{
   res.render('admin/view-all-users',{orders})
  })
})


module.exports = router;
