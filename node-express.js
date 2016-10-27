/**********************************************************************
 * "/" - Se responde con el index
 * "/crearUsuario/nombre" - Crea el usuario y devuelve el juego junto con sus datos. Dentro de agregarUsuario() se crea
 * su registro en el fichero juego.json, con miras a ahorrar comprobaciones cuando se guarde su score
 * "/resultados/" - Lee el contenido de juego.json
 *
 * *
 *
 **********************************************************************/
var fs = require("fs");
var config = JSON.parse(fs.readFileSync("config.json"));
var host = config.host;
var port = config.port;
var exp = require("express");
var modelo = require("./servidor/modelo.js");
var app = exp();
var juego = new modelo.Juego();
var MongoClient = require('mongodb');
var bodyParser = require("body-parser");
var urlM = 'mongodb://josemaria:procesos1617@ds031617.mlab.com:31617/usuariosjuego';
var dbM;
var usersM;

//app.use(app.router);
app.use(exp.static(__dirname + "/cliente/"));
app.use(bodyParser());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get("/mierdaPrueba/", function (request, response) {
	var jsa = JSON.parse(fs.readFileSync("./cliente/js/juego-json.json"));
	response.send(jsa);
});

app.get("/datosJuego/:nivel", function (request, response) {
	console.log("Llamada a /datosJuego/" + request.params.nivel);
	var jsa = JSON.parse(fs.readFileSync("./cliente/js/juego-json.json"));
	//console.log("Respuesta es -> " + jsa[request.params.nivel]);
	//console.log(request.params.nivel);
	response.send(jsa[request.params.nivel]);
});
app.get("/", function (request, response) {
	console.log("Inicio de página");
	var contenido = fs.readFileSync("./cliente/index.html");
	response.setHeader("Content-type", "text/html");
	response.send(contenido);
});

app.post("/crearUsuario/", function (request, response) {
	var email = request.body.email;
	var pass = request.body.password;
	var criteria = {"nombre":email};
	usersM.find(criteria, function(err,cursor){
		if(err){
			console.log(err);
		} else {
			cursor.toArray(function(er, users){
				//console.log(users);
				if(users.length == 0){
					console.log("No existe el usuario");
					var usuario = new modelo.Usuario(email);
					juego.agregarUsuario(usuario);
					usersM.insert({id_juego:usuario.id, nombre:usuario.nombre, password:pass, nivel:usuario.nivel, vidas:usuario.vidas}, function(err,result){
						if(err){
							console.log(err);
						} else {
							console.log("Usuario insertado");
							console.log(result);
							response.send(result);
						}
					});
				} else {
					console.log("El usuario ya existe");
					response.send({nivel:-1});
				}
			});
		}
	});
});

app.post('/login/', function(request, response){
	var email = request.body.email;
	var password = request.body.password;
	//console.log(password);
	//console.log(email + " - " + password);
	var criteria = {"nombre":email};
	//
	if (password != undefined){
		criteria["password"] = password;
	}
	//console.log(criteria);
	usersM.find(criteria, function(err,cursor){
	if(err){
		console.log(err);
	} else {
		cursor.toArray(function(er, users){
			//console.log(users);
			if(users.length == 0){
				console.log("No existe el usuario");
				response.send({nivel:-1});
			} else {
				//console.log(users[0])
				response.send(users[0]);
			}
		});
	}
	});
});

app.get("/resultados/", function (request, response) {
	var file = fs.readFileSync("./juego.json");
	var data = JSON.parse(file);
	//console.log(data.puntuaciones);
	response.send(data.puntuaciones);
});

app.get('limpiarMongo', function(request,response){
	usersM.remove({});
	response.send({"ok":"Todo bien"});
});

app.get('/nivelCompletado/:id/:tiempo', function (request, response) {
	var id = request.params.id;
	var tiempo = request.params.tiempo;
	var usuario = juego.buscarUsuarioById(id);
	console.log(id + " - " + tiempo + " - " + usuario);
	usuario.nivel += 1;
	console.log(usuario.nivel);
	usuario.tiempo = tiempo;
	if (usuario != undefined) {
		var result = {}
		result.user = usuario.nombre;
		result.score = usuario.tiempo;
		var data = JSON.parse(fs.readFileSync("./juego.json"));
		var userRecord = data.puntuaciones.filter(function(jsonEl){
			return jsonEl.user == usuario.nombre;
		});
		if(userRecord.length == 0){
			data.puntuaciones.push(result);
			console.log("Puntuaciones guardadas tras push ->\n" + data.puntuaciones);
		} else {
			if (userRecord[0].score > tiempo){
				userRecord[0].score = tiempo;
			} 
		}
		fs.writeFile("./juego.json", JSON.stringify(data), function (err) {
			if (err) {
				return console.log(err);
			}
			console.log("The file was saved!");
		});
	}
	console.log("Nuevo nivel es ->" + usuario.nivel);
	response.send({'nivel':usuario.nivel});
});

app.get('/obtenerResultados/:id', function (request, response) {
	var id = request.params.id;
	var usuario = juego.buscarUsuarioById(id);
	response.send({'nivel':usuario.nivel, 'tiempo':usuario.tiempo, 'nombre':usuario.nombre});
});

console.log("Servidor escuchando en el puerto "+process.env.PORT );
app.listen(process.env.PORT || port);
//console.log("Servidor escuchando en el puerto " + port);
//app.listen(port, host);

function mongoConnect(){
	MongoClient.connect(urlM, function (err, db) {
		if(err){
			console.log(err);
		} else {
			console.log("Conectados");
			dbM = db;
			usersM = dbM.collection("usuarios");
			//console.log(usersM);
			//console.log("Datos extraidos");
		}
	});
}

mongoConnect();

