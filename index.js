const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

const app = express()

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const port = 9000;

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'databantuan'
})

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

//mencocokkan username dan password yang ada di database
app.post('/login/admin', function(request, response) {
    let data = request.body
	var username = data.username;
	var password = data.password;
	if (username && password) {
		db.query('SELECT * FROM admin WHERE username= ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/admin');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/login/admin', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back Admin!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Mohon login terlebih dahulu!'
        })
        }
	
	results.end();
});

//mencocokkan username dan password yang ada di database
app.post('/login/donatur', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		db.query('SELECT * FROM donatur WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Selamat Datang Donatur, ' + request.session.username + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});


/************* CRUD DONATUR ****************/
// endpoint menampilkan data donatur dengan menggunakan token
app.get('/donatur', isAuthorized, (req, res)=>{
    let sql = `
        select nama from donatur
    `

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: "success get all donatur",
            data: result
        })
    })
})

// endpoint menambahkan data donatur dengan menggunakan token
app.post('/donatur',isAuthorized, (req, res) => {
    let data = req.body
    let sql = `
        insert into donatur (username, password, nama, alamat, telepon)
        values ('`+data.username+`','`+data.password+`','`+data.nama+`', '`+data.alamat+`', '`+data.telepon+`')`

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'data donatur created',
            data: result
        })
    })
})

// endpoint menampilkan data donatur dengan id menggunakan token
app.get('/donatur/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from donatur
        where id = `+req.params.id+`
        limit 1`

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Success get donatur detail',
            data: result[0]
        })
    })
})

// endpoint mengubah data donatur dengan id menggunakan token
app.put('/donatur/:id', isAuthorized, (req, res)=>{
    let data = req.body

    let sql = `
        update donatur
        set username = '`+data.username+`', password = '`+data.password+`', nama = '`+data.nama+`', 
        alamat = '`+data.alamat+`', telepon = '`+data.telepon+`'
        where id = '`+req.params.id+`'
        `
    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Data donatur has been update',
            data: result
        })
    })
})

// endpoint menghapus data donatur dengan id menggunakan token
app.delete('/donatur/:id', isAuthorized, (req, res)=>{
    let sql = `
        delete from donatur
        where id ='`+req.params.id+`'
    `
    db.query(sql, (err, result)=>{
        if  (err) throw err
        res.json({
            message: ' Data donatur has been deleted',
            data: result
        })
    })
})

/************* CRUD BANTUAN ***************/
// endpoint menampilkan data bantuan menggunakan token
app.get('/bantuan', isAuthorized, (req, res)=>{
    let sql = `
        select tanggal, donatur, keterangan, jumlah, penerima from bantuan
    `
    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Success get all bantuan',
            data: result
        })
    })
})

// endpoint menambahkan data kartu menggunakan token
app.post('/bantuan', isAuthorized, (req, res)=>{
    let data = req.body
    let sql = `
        insert into bantuan( tanggal, donatur, keterangan, jumlah, penerima)
        values( '`+data.tanggal+`', '`+data.donatur+`', '`+data.keterangan+`', '`+data.jumlah+`', '`+data.penerima+`')`

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'bantuan created!',
            data: result
        })
    })
})

// endpoint menampilkan data bantuan dengan id menggunakan token
app.get('/bantuan/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from bantuan
        where id = `+req.params.id+`
        limit 1
    `
    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Success get bantuan detail',
            data: result[0]
        })
    })
})

// endpoint edit data bantuan dengan id menggunakan token
app.put('/bantuan/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update bantuan
        set tanggal = '`+data.tanggal+`',donatur = '`+data.donatur+`', keterangan = '`+data.keterangan+`',
        jumlah = '`+data.jumlah+`', penerima = '`+data.penerima+`'
        where id = `+req.params.id+`
        `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Data bantuan has been update!',
            data: result
        })
    })
})

// endpoint hapus data bantuan dengan id menggunakan token
app.delete('/bantuan/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from bantuan 
        where id = `+req.params.id+`
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        res.json({
            success: true,
            message: 'Data bantuan has been delete!',
            data: result
        })
    })
})

/********** Run Application **********/
app.listen(port, () => {
    console.log('App running on port ' + port)
})