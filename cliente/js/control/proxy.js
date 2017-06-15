function proxy() {
    /**
     * Se comprueba la validez de las credenciales de login. El ultimo atributo indica si los datos se están comprobando
     * desde una cookie o desde el formulario de login. Si es desde cookie, no comprobamos la contraseña.
     */
    this.keylogger;
    this.affdexDetector = new Affdex();
    this.affdexDetector.onInitializeSuccess(onInitializeSuccessDEMO);
    this.affdexDetector.onWebcamConnectSuccess(onWebcamConnectSuccessDEMO);
    this.affdexDetector.onWebcamConnectFailure(onWebcamConnectFailureDEMO);
    this.affdexDetector.onStopSuccess(onStopSuccessDEMO);
    this.affdexDetector.onImageResultsSuccess(onImageResultsSuccessDEMO);
    this.beyondVerbal = new BeyondVerbalAPI('https://token.beyondverbal.com/token','https://apiv3.beyondverbal.com/v3/recording/');
    
    var self = this;
    this.comprobarUsuarioMongo = function (nombre, pass, fromCookie) {
        if (pass == "" && !fromCookie) {
            estilosAlerta('#claveL')
        } else {
            //Definimos el callback que trate los datos que devuelva el servidor
            //El servidor puede devolver {"user_name":"ERROR"...} o {"user_name":datos validos, ....}
            var callback = function (data) {
                if (data.user_name == "ERROR") {
                    console.log("El usuario no existe");
                    borrarCookies();
                    loginIncorrecto();
                } else {
                    setCookies(data);
                    console.log(data);
                    console.log("El usuario es correcto");
                    $("#myModal").css("display","none");
                    $("#myBtn").css("display","none");
                    $(".info").css("display","none");
                    $(".intro").css("display","none");
                    $("#header-intro").css("display", "none");
                    showGameControls();
                    self.datosJuego_ID();
                }
            }
            peticionAjax("POST", "/login/", true, JSON.stringify({
                email_name: nombre,
                password: pass
            }), callback);
        }
    };

    this.datosJuego_ID = function(){
        var callback = function(data){
            console.log(data);
            if(data.nivel == -1 || data == {}){
                finJuego("Lo siento, no tenemos más niveles",resetControl);
            } else {
                infoJuego = data;
                self.keylogger = new KeyLogger(infoJuego.nivel);
                console.log("Datos recibidos correctos: " + (infoJuego.nivel != -1));
                $("#juegoContainer").load("../assets/recipes_info/" + data.recipe.recipe_info, function(){
                    console.log("Info de receta cargado");
                });
            }
        }
        peticionAjax("GET", '/datosJuego/'+$.cookie("id"), true, JSON.stringify(), callback);
    }
    /**
     * El servidor registra los resultados del nivel actual y nos indica el siguiente nivel.
     */
    this.nivelCompletado = function (tiempo, vidas) {
            var callback = function (datos) {
                $.cookie("nivel", datos.nivel);
                console.log()
                showGameControls();
            }
            peticionAjax("POST", "/nivelCompletado/" + $.cookie("id") + "/" + tiempo + "/" + vidas,
            true, 
            JSON.stringify({
                affectiva:this.affdexDetector.FaceInformation,
                beyond:this.beyondVerbal.SpeechInformation,
                keys:this.keylogger.getKeysInformation() 
            }), 
            callback);
            //$.post("/nivelCompletado/" + $.cookie("id") + "/" + tiempo + "/" + vidas, callback);
        }
    /**
     * Obtenemos los resultados de la partida actual
     */
    this.obtenerResultados = function () {
        var callback = function (datos) {
            console.log("Callback de obtener resultados con " + datos.length + " resultados");
            mostrarResultadosUsuario(datos);
        }
        $.get("/obtenerResultados/" + $.cookie("id"), callback);
    }

    this.crearUsuario = function (user_name, email, pass, url) {
        var callback = function (data) {
            $.loadingBlockHide();
            if (data.result == "userExists") {
                estilosAlerta('#estilosAlerta');
                $('#nombreUsuario').val('Usuario existente');
            } else {
                $("#formRegistro").remove();
                $("#juegoContainer").prepend('<span id="warning" style="font-weight: bold;">Te acabamos de mandar un mensaje con un link para confirmar tu cuenta. </span>');
                $("#juegoContainer").prepend('<span id="warning" style="font-weight: bold;">Comprueba tu bandeja de correo electrónico. </span>');
            }
        }
        peticionAjax("POST", "/crearUsuario/", true, JSON.stringify({
            user_name:user_name,
            email: email,
            password: pass,
            url: url
        }), callback);
    }
    this.modificarUsuario = function (user_name, email, pass) {
        var callback = function (data) {
            if (data.nModified != 1) {
                estilosAlerta('#nombreUsuario, #correoUsuario');
                $('#nombreUsuario').val('Usuario existente');
            } else {
                $("#juegoContainer").prepend('<span id="warning" style="color:#04B404">Yay!!! Todo ha ido bien</span>');
                $("#juegoContainer").prepend('<span id="warning" style="font-weight: bold;">Modificación realizada correctamente. </span>');
                $("#formRegistro").remove();
                borrarSiguienteNivel();
                resetControl();
            }
        }
        peticionAjax("POST", "/modificarUsuario/", true,
            JSON.stringify({
                old_email: $.cookie('email'),
                new_email: email,
                new_password: pass,
                new_user_name: user_name
            }), callback);
    }

    this.eliminarUsuario = function (nombre, pass) {
        var callback = function (data) {
            if (data.n != 1) {
                $('#nombreUsuario').attr('style', "border-radius: 5px; border:#FF0000 1px solid;");
                $('#nombreUsuario').val('Error al borrar. Comprueba que usuario y contraseña son correctos');
            } else {
                $("#formRegistro").remove();
                borrarSiguienteNivel();
                resetControl();
                $("#juegoContainer").prepend('<span id="warning" style="font-weight: bold;">Eliminación realizada correctamente. </span>');
            }
        }
        peticionAjax("DELETE", "/eliminarUsuario/", true, JSON.stringify({
            email: nombre,
            password: pass
        }), callback);
    }
    this.startAffectivaDetection = function () {
        this.affdexDetector.startDetection();
    }
    this.stopAffectivaDetection = function () {
        this.affdexDetector.stopDetection();
    }
    this.authenticateBV = function (options) {
        console.log('url token:' + options.url.tokenUrl);
        console.log("LLEGAMOS A AUTHENTICATE");
        //options.apiKey = "f5a2d998-132e-41c3-b4f4-e36822e3da9a";
        $.ajax({
            url: options.url.tokenUrl,
            type: "POST",
            dataType: 'text',
            contentType: 'application/x-www-form-urlencoded',
            data: {
                grant_type: "client_credentials",
                apiKey: options.apiKey
            }
        }).fail(function (jqXHR, textStatus, errorThrown)
            {
                console.log(JSON.stringify(jqXHR) + errorThrown);
            })
            .done(function (data)
            {
                console.log("AUTHENTICATE CON EXITO");
                console.log('sucess::' + JSON.stringify(data));
                var token = JSON.parse(data);
                self.beyondVerbal.options.token = token.access_token;
            });
    }
    this.analyzeFileBV = function (blob){
        this.beyondVerbal.analyzeFile(blob)
            .done(function (res)
            {
                console.log("CALLBACK DONE DE ANALYZE_FILE");
                Show(res);
                res = JSON.parse(res);
                console.log("Arousal Mean - " + res.result.analysisSummary.AnalysisResult.Arousal.Mean);
                console.log("Temper Mean - " + res.result.analysisSummary.AnalysisResult.Temper.Mean);
                console.log("Valence Mean - " + res.result.analysisSummary.AnalysisResult.Valence.Mean);
                console.log("Group11_Primary - " + res.result.analysisSegments[0].analysis.Mood.Group11.Primary.Phrase);
                console.log("Composite_Primary - " + res.result.analysisSegments[0].analysis.Mood.Composite.Primary.Phrase);
                self.beyondVerbal.SpeechInformation = {
                    "Arousal":res.result.analysisSummary.AnalysisResult.Arousal.Mean,
                    "Temper":res.result.analysisSummary.AnalysisResult.Temper.Mean,
                    "Valence": res.result.analysisSummary.AnalysisResult.Valence.Mean,
                    "Group11_Primary": res.result.analysisSegments[0].analysis.Mood.Group11.Primary.Phrase,
                    "Composite_Primary":res.result.analysisSegments[0].analysis.Mood.Composite.Primary.Phrase
                }
            })
            .fail(function (err)
            {
                console.log(err);
                self.beyondVerbal.SpeechInformation = {
                    "Arousal":null,
                    "Temper":null,
                    "Valence": null,
                    "Group11_Primary": null,
                    "Composite_Primary":null
                }
                //Show(err);
            });
    }
    this.authenticateBV(this.beyondVerbal.options);
}

function peticionAjax(peticion, url, async, body, successCallback) {
    $.ajax({
        type: peticion,
        contentType: "application/json",
        async: async,
        url: url,
        data: body,
        success: successCallback
    });
}

function meterUsuario(nombre, pass, activo){
    peticionAjax("POST","/meterEnUsuarios/",true,JSON.stringify({email: nombre, password: pass, activo:activo}),function(data){
        console.log(data)
    });
}
//email: nombre, password: pass, activo:activo
