var express = require('express');
const { route } = require('./admin');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const { response } = require('express');


/* GET home page. */
router.get("/", function (req, res) {

  productHelper.getAllProducts().then((products) => {
    // console.log(products);
    res.render('admin/view-products', { title: "Shoping - Cart", products, admin: true })
  })
})

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
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
  let id= req.params.id
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

module.exports = router;
