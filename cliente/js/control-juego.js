//var urlD = "http://juegoprocesos.herokuapp.com/";
//var urlD = "http://localhost:1338";
/**
 * Si hay alguna cookie establecida, leemos los datos asociados a ella del servidor. Si no, partimos de cero (pedimos nombre).
 * CAUTION!! En estos momentos no es necesario, pero si hubiera varios clientes (app movil Android, app movil iOS)
 * entonces cabría la posibilidad de que se hubiera avanzado en otro sitio y habría que mantener la información actualizada
 */

function inicio() {
    if ($.cookie('nombre') != undefined) {
        proxy.comprobarUsuarioMongo($.cookie('nombre'), undefined, true)
    } else {
        console.log("No hay una cookie");
        construirLogin();
    }
}

function limpiarMongo() {
    $.getJSON('/limpiarMongo/', function (datos) {
        console.log("Coleccion vacia");
        console.log(datos);
    });
}

function nivelCompletado(tiempo) {
    game.destroy();
    $("#gameMusic").animate({volume:0},1000,function(){
        $(this).remove();
    });
    $('#juegoId').append("<h2 id='enh'>¡Enhorabuena!</h2>");
    proxy.nivelCompletado(tiempo);
    proxy.obtenerResultados();
}

function mostrarResultadosUsuario(datos) {
    console.log("Mostrar resultados con parametros")
    $('#res').remove();
    $('#resultados').remove();
    $('#juegoId').append('<h3 id="res">Resultados</h3>');
    var cadena = "<table id='resultados' class='table table-bordered table-condensed'><tr><th>Nombre</th><th>Nivel</th><th>Tiempo</th></tr>";
    for (var i = 0; i < datos.length; i++) {
        cadena = cadena + "<tr><td>" + $.cookie("nombre") + "</td><td> " + datos[i].nivel + "</td>" + "</td><td> " + datos[i].tiempo + "</td></tr>";
    }
    cadena = cadena + "</table>";
    $('#juegoId').append(cadena);
}

//Funciones de comunicación
/**
 * Registramos al usuario
 * @param nombre - email validado
 * @param pass - contrasena introducida
 */
function crearUsuario(nombre, pass) {
    if (nombre == "") {
        nombre = "jugador";
    }
    var url = '';
    //url = "http://localhost:1338"
    url = "http://juegoprocesos.herokuapp.com";
    proxy.crearUsuario(nombre, pass, url);
    
}

function modificarUsuarioServer(nombre, pass) {
    proxy.modificarUsuario(nombre,pass);
}

function eliminarUsuarioServer(nombre, pass) {
    proxy.eliminarUsuario(nombre,pass);
}

/**
 * Borramos la cookie que hubiera en el navegador
 */
function borrarCookies() {
    $.removeCookie('nombre');
    $.removeCookie('id');
    $.removeCookie('nivel');
    $.removeCookie('maxNivel');
}

function setCookies(data) {
    $.cookie('nombre', data.nombre);
    $.cookie('id', data.id);
    $.cookie('nivel', data.nivel);
    $.cookie('maxNivel', data.maxNivel);
}

function finJuego(text,callback){
    $("#gameMusic").animate({volume:0},1000);
    $('#juegoId').append("<h2 id='enh'>"+text+"</h2>");
    $('#control').append('<button type="button" id="volverBtn" class="btn btn-primary btn-md">Volver a empezar</button>')
    $('#volverBtn').on('click', function () {
        $(this).remove();
        $('#datos').remove();
        $('#prog').remove();
        callback();
    });
}

function cambiarUsuario(action){
    eval("construirFormulario"+action+"()")
}

function apagarMusica(){
    $("#backMusic").animate({volume:0},100);
}