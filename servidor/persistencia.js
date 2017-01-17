var MongoClient = require('mongodb');
var ObjectID = require("mongodb").ObjectID;
var urlM = 'mongodb://josemaria:procesos1617@ds031617.mlab.com:31617/usuariosjuego';
var dbM;
var usersM;
var resultsM;

module.exports.mongoConnect = function(juego){
	MongoClient.connect(urlM, function (err, db) {
		if(err){
			console.log(err);
		} else {
			console.log("Conectados en persistencia");
			dbM = db;
			usersM = dbM.collection("usuarios");
			usersM.find().toArray(function(err, cursor){
				if(err){
					console.log(err)
				} else {
					cursor.forEach(function(actual){
						console.log("\t\t Model -> \t Agregado nuevo usuario al modelo");
            			juego.newUsuario(actual.user_name, actual.email, actual.pass, actual.time_register, actual.activo, actual._id)
					})
				}
			});
		}
	});
}

module.exports.addNuevoResultado = function(usuario, tiempo, vidas){
	dbM.collection("partidas").update(
		{id_usuario:usuario.id},
		{$push: {partidas:{id_partida:usuario.id_partida_actual, nivel:usuario.nivel, tiempo: tiempo, vidas: vidas}}},
		function(err, doc){
			if(err){
				console.log(err);
			} else {
				var nivel = usuario.nivel;
				usuario.nivel += 1;
				if (usuario.nivel > usuario.maxNivel) {
					usuario.nivel = 1;
				}
				console.log("\t Agregado registro de resultados")
			}
		})
}

function findSomething(collection,criteria,callback){
	dbM.collection(collection).find(criteria,callback);
}
module.exports.findSomething = findSomething;

function insertOn(collection,object,callback){
	dbM.collection(collection).insert(object,callback);
}
module.exports.insertOn = insertOn;

module.exports.removeOn = function(collection,criteria,callback){
    dbM.collection(collection).remove(criteria,callback);
}

module.exports.updateOn = function(collection,criteria,changes,options,callback){
    dbM.collection(collection).update(criteria,changes,options,callback)
}

module.exports.insertarUsuario = function(newUser, gestorPartidas, response){
	usersM.insert({user_name: newUser.user_name, email:newUser.email, password: newUser.password, id_registro: newUser.time_register, activo:newUser.activo}, function(err, result){
		if(err){
			console.log(err);
		} else {
			newUser.id = result.ops[0]._id;
			console.log("\t Id de Mongo asignado a usuario insertado - " + newUser.id);
			function consoleLogError(err,result){
				if(err){
					console.log(err);
				} else {
					console.log("\t Datos de partifas inicializados en insertarUsuario")
					gestorPartidas.addRegistro(newUser.id);
					console.log(gestorPartidas);
					console.log(gestorPartidas.toString());
					if (response != undefined) response.send({result:"insertOnUsuarios",id:newUser.id,maxNivel:newUser.maxNivel});
				}
			}
			insertOn("partidas",{id_usuario:newUser.id, partidas:[]}, consoleLogError);
		}
	})
}

module.exports.getResultados = function(response){
	console.log("Resultados");
    dbM.collection("usuarios").find({}).toArray(function(err,data){
		callBackUsuarios(err,data,response);
	});
}

function callBackUsuarios(err,data,response){
	console.log("\t Callback de usuarios en persistencia");
	var res = [];
	if(err){
		console.log(err);
	} else {
		if(data.length != 0){
			var max = data.length;
			data.forEach(function(item,i){
				var user = {}
				user.nombre = item.nombre;
				dbM.collection("resultados").find({usuario:ObjectID(item._id)}).toArray(function(err,results){
					callBackResultados(err,results,user,res,response,i,max);				
				});
			});
		} else {
			response.send({});
		}
	}
}

function callBackResultados(err,results,user,res,response,i,max){
	console.log("\t\t Callback de usuarios en persistencia");
	if(err){
		console.log(err);
	} else if(results.length != 0) {
		user.resultados = results[0].resultados;
		res.push(user);
		if(i + 1 == max){
			response.send(res);
		}
	}
}