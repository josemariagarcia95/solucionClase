function proxy() {
    /**
     * Se comprueba la validez de las credenciales de login. El ultimo atributo indica si los datos se están comprobando
     * desde una cookie o desde el formulario de login. Si es desde cookie, no comprobamos la contraseña.
     */
    this.keylogger = new KeyLogger();
    this.affdexDetector = new Affdex();
    this.affdexDetector.onInitializeSuccess(onInitializeSuccessDEMO);
    this.affdexDetector.onWebcamConnectSuccess(onWebcamConnectSuccessDEMO);
    this.affdexDetector.onWebcamConnectFailure(onWebcamConnectFailureDEMO);
    this.affdexDetector.onStopSuccess(onStopSuccessDEMO);
    this.affdexDetector.onImageResultsSuccess(onImageResultsSuccessDEMO);
    this.beyondVerbal = new BeyondVerbalAPI('https://token.beyondverbal.com/token','https://apiv3.beyondverbal.com/v1/recording/');
    
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
                    showGameControls();
                }
            }
            peticionAjax("POST", "/login/", true, JSON.stringify({
                email_name: nombre,
                password: pass
            }), callback);
        }
    };
    /**
     * El servidor registra los resultados del nivel actual y nos indica el siguiente nivel.
     */
    this.nivelCompletado = function (tiempo, vidas) {
            var callback = function (datos) {
                $.cookie("nivel", datos.nivel);
                console.log()
                showGameControls();
            }
            $.get("/nivelCompletado/" + $.cookie("id") + "/" + tiempo + "/" + vidas, callback);
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
                console.log(JSON.parse(data));
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
                this.beyondVerbal.SpeechInformation = {
                    "Arousal":res.result.analysisSummary.AnalysisResult.Arousal.Mean,
                    "Temper":res.result.analysisSummary.AnalysisResult.Temper.Mean,
                    "Valence": res.result.analysisSummary.AnalysisResult.Valence.Mean
                }
            })
            .fail(function (err)
            {
                Show(err);
            });
    }

    this.sendAffectiveLogs = function () {
        peticionAjax("POST", 
                    "/affective-log/" + $.cookie("id") + "/" + $.cookie("nivel"), 
                    false,
                    JSON.stringify({
                       "affectiva":this.affdexDetector.FaceInformation,
                       "beyond":this.beyond.SpeechInformation,
                       "keys":this.keylogger.getKeysInformation() 
                    }),
                    function(){
                        console.log("Datos enviados correctamente");
                        //TO DO: Los datos los reiniciará la lógica afectiva cuando se implemente
                        //self.affdexDetector.FaceInformation = {};
                        //self.beyond.SpeechInformation = {};
                        //self.keylogger.KeysInformation = {};
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
