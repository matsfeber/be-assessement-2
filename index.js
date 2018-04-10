'use strict'

var express = require('express')
var mysql = require('mysql')
var session = require('express-session')
var bodyParser = require('body-parser').urlencoded({
  extended: true
})
//var argon2 = require('argon2')
var multer = require('multer')
var upload = multer({
 dest: 'static/images/'
})

require('dotenv').config()

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect()

var port = 1905

express()

  .use('/images', express.static('static/images'))
  .use(express.static('static'))
  .use(bodyParser)
  .use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
  }))

  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', loginPage)
  .get('/register', signupPage)
  .get('/activity.ejs', activity)
  .get('/profile/:id', profile)
  .get('/messages.ejs', messages)
  .get('/activity/:id', detail)
  .get('/add', add)
  .get('/logOut', logOut)
  .get('/remove/:id', remove)
  .get('/editPage', editPage)
  .post('/log-in', login)
  .post('/sign-up', upload.single('img'), signup)
  .post('/addActivity', addActivity)
  .post('/update', update)
  .listen(port)

function signup(req, res) {
  var body = req.body

  connection.query('INSERT INTO users SET ?', {
   img: req.file.filename ,
   id: body.id,
   name: body.name,
   age: body.age,
   sex: body.sex,
   preference: body.preference,
   wants: body.wants,
   email: body.email,
   password: body.password
   }, done)

  function done(err, data) {
    if (err) throw err

    res.redirect('/')
  }
}



function login(req, res) {
  var body = Object.assign({}, req.body)
  connection.query('SELECT * FROM users WHERE email = ?', body.email, function(err, users) {
    if (err) throw (err)
    var user = users[0]

    if (user.password === body.password) {
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/profile/' + user.id)
    } else {
      res.redirect('wrongLogin.html')
    }
  })
}

function logOut(req, res) {
  req.session.destroy(done)

  function done(err, data) {
    if (err) throw (err)
    res.redirect('/')
  }
}

function signupPage(req, res) {
  res.render('register.ejs')
}

function loginPage(req, res, next) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('login.ejs', {
        data: data
      })
    }
  }
}

function activity(req, res, next) {
  connection.query('SELECT * FROM activity', done)

  function done(err, data) {
    if (req.session.loggedIn = false) {
      res.end('Niet ingelogd')
    } else {
      res.render('activity.ejs', {
        data: data,
        activity: req.session.activity
      })
    }
  }
}

function messages(req, res) {
  res.render('messages.ejs')
}

function profile(req, res) {
  var id = req.params.id
  connection.query('SELECT * FROM users WHERE id = ?', id, done)

  function done(err, users) {

    if (req.session.loggedIn = false) {
      res.end('Niet ingelogd')
    } else {
      res.render('profile.ejs', {
        user: users[0]
      })
    }
  }
}

function detail(req, res) {

  var id = req.params.id
  connection.query('SELECT * FROM activity', done)

  function done(err, data) {
    if (err) {
      res.end('err')
    } else {
      res.render('detailActivity.ejs', {
        data: data[id]
      })
    }
  }
}

function add(req, res, data) {
  res.render('add')
}

function addActivity(req, res, data) {
  var body = req.body
  var user = req.session.user.id

  connection.query('INSERT INTO activity SET ?', body, done)

  function done(err, data) {
    if (err) throw err

  }

  connection.query('INSERT INTO activity SET createdBy = ?', user, onDone)

  function onDone(err, data) {
    if (err) throw err
    res.redirect('/activity.ejs')
  }
}

function remove(req, res) {
  var id = req.session.user.id
  connection.query('DELETE FROM users WHERE id = ?', id, done)

  function done(err, data) {
    res.redirect('/')
  }
}

function editPage(req, res) {
  res.render('editProfile')
}

function update(req, res) {
  var user = req.session.user.id
  var body = req.body

  connection.query('UPDATE users SET name = ?, age = ?, sex = ?, preference = ?, wants = ?, email = ?, password = ? WHERE id = ?', [body.name, body.age, body.sex, body.preference, body.wants, body.email, body.password, user], done)

  function done(err, data) {
    if (err) throw err

    res.redirect('/')
  }
}
