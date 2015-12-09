angular.module("dcDatePicker", []);
var DatePicker;
(function (DatePicker) {
    var Directive = (function () {
        function Directive($compile, $document, $filter) {
            var _this = this;
            this.$compile = $compile;
            this.$document = $document;
            this.$filter = $filter;
            this.restrict = "A";
            this.scope = {
                ngModel: "=",
                dateType: "=",
                min: "=?",
                max: "=?",
                format: "@?",
                notAllowed: "=?",
                onlyAllowed: "=?",
                onlyDays: "=?",
                notDays: "=?"
            };
            this.require = "ngModel";
            this.link = function (scope, elem, attrs, ngModel) {
                var max = null;
                var min = null;
                var notAllowed = null;
                var onlyAllowed = null;
                var notDays = null;
                var onlyDays = null;
                var initDate = function (fecha) {
                    var tipo = Object.prototype.toString.call(fecha);
                    fecha = (tipo !== '[object Date]') ? new Date() : fecha;
                    fecha.setMilliseconds(0);
                    fecha.setHours(0);
                    fecha.setMinutes(0);
                    fecha.setSeconds(0);
                    return fecha;
                };
                var getCadena = function (dia) {
                    if (dia === null) {
                        return "";
                    }
                    if (!scope.format) {
                        scope.format = "d/MM/yyyy";
                    }
                    return _this.$filter("date")(dia, scope.format);
                };
                var aplicar = function () {
                    var dia = ngModel.$modelValue;
                    elem.val(getCadena(dia));
                };
                var template = "\n\t\t\t\t<div style=\"position:absolute;display:block;background-color:white;left:{{left}}px;top:{{top}}px;min-width:{{width}}px;padding:10px;box-shadow:0 3px 3px rgba(0,0,0,0.5);z-index:1000;\">\n\t\t\t\t\t<div class=\"container-fluid\">\n\t\t\t\t\t\t<div class=\"row bg-primary\" style=\"margin-left:-25px;margin-right:-25px;margin-top:-10px;\">\n\t\t\t\t\t\t\t<!--Mostramos la fila que contiene los a\u00F1os-->\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:left;cursor:pointer;\" ng-click=\"cambiaAno(-1)\">\n\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-arrow-left\"></span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:center;\">\n\t\t\t\t\t\t\t\t{{puntero | date : 'yyyy'}}\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:right;cursor:pointer;\" ng-click=\"cambiaAno(1)\">\n\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-arrow-right\"></span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"row bg-warning\" ng-show=\"dateType === 'day'\" style=\"margin-left:-25px;margin-right:-25px;\">\n\t\t\t\t\t\t\t<!-- Ahora la fila que contendr\u00E1 el paso del m\u00E9s (si no es vista de meses) -->\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:left;cursor:pointer\" ng-click=\"cambiaMes(-1)\">\n\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-arrow-left\"></span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:center;\">\n\t\t\t\t\t\t\t\t{{puntero | date:'MMMM'}}\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-xs-4\" style=\"padding:10px;text-align:right;cursor:pointer\" ng-click=\"cambiaMes(1)\">\n\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-arrow-right\"></span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<table class=\"table\" ng-if=\"dateType==='month'\">\n\t\t\t\t\t\t\t<!-- Ahora las filas de los meses (en caso de que sea vista tipo mes) -->\n\t\t\t\t\t\t\t<tr ng-repeat=\"mes in meses\">\n\t\t\t\t\t\t\t\t<td ng-repeat=\"dia in mes\" ng-style=\"estiloDia(dia)\" ng-class=\"claseDia(dia)\" ng-click=\"asignar(dia)\" style=\"cursor:pointer;text-align:center;\" ng-mouseover=\"mouseover($event, dia)\" ng-mouseleave=\"mouseout($event)\">{{dia | date:'MMM'}}</td>\n\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<!-- Ahora en caso de que sea fecha de tipo d\u00EDa lo mostramos como una tabla -->\n\t\t\t\t\t\t<table class=\"table\" ng-if=\"dateType === 'day'\">\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t<th ng-repeat=\"dia in diasCabecera track by $index\" style=\"text-align:center;\">{{dia | date : 'EEE'}}</th>\n\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t<tr ng-repeat=\"semana in semanas track by $index\">\n\t\t\t\t\t\t\t\t<td ng-repeat=\"dia in semana track by $index\" ng-style=\"estiloDia(dia)\" ng-class=\"claseDia(dia)\" ng-click=\"asignar(dia)\" style=\"cursor:pointer;text-align:center;\" ng-mouseover=\"mouseover($event, dia)\" ng-mouseleave=\"mouseout($event)\">{{dia | date:'d'}}</td>\n\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t</table>\n\t\t\t\t\t\t<div class=\"btn-group\">\n\t\t\t\t\t\t\t<button class=\"btn-default btn btn-sm\" ng-click=\"borrar()\">Borrar</button>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t";
                elem.css("cursor", "pointer");
                scope.diasCabecera = [];
                var dia = new Date();
                dia.setMonth(11);
                dia.setFullYear(2003);
                dia.setDate(1);
                dia.setHours(0);
                dia.setMinutes(0);
                dia.setSeconds(0);
                dia.setMilliseconds(0);
                scope.diasCabecera.push(dia);
                for (var i = 0; i < 6; i++) {
                    var dia = new Date(dia.getTime() + 86400000);
                    scope.diasCabecera.push(dia);
                }
                var getMeses = function () {
                    scope.meses = [];
                    var ano = scope.puntero.getFullYear();
                    var m = 0;
                    for (var i = 0; i < 12; i++) {
                        var nuevoMes = new Date();
                        nuevoMes.setFullYear(ano);
                        nuevoMes.setMonth(i);
                        nuevoMes.setDate(1);
                        nuevoMes = initDate(nuevoMes);
                        if (i % 3 === 0 && i !== 0) {
                            m++;
                        }
                        scope.meses[m] = (scope.meses[m] !== undefined) ? scope.meses[m] : [];
                        scope.meses[m].push(nuevoMes);
                    }
                };
                var getDiaSemana = function (dia) {
                    return (dia === 0) ? 6 : dia - 1;
                };
                var getSemanas = function () {
                    scope.semanas = [];
                    var diaSemana = getDiaSemana(scope.dias[0].getDay());
                    var sem = 0;
                    for (var i = 0; i < diaSemana; i++) {
                        scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
                        scope.semanas[sem].push(null);
                    }
                    for (var d = 0; d < scope.dias.length; d++) {
                        diaSemana = getDiaSemana(scope.dias[d].getDay());
                        sem = (diaSemana === 0) ? sem + 1 : sem;
                        scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
                        scope.semanas[sem].push(scope.dias[d]);
                    }
                    for (var i = 6; i > diaSemana; diaSemana++) {
                        scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
                        scope.semanas[sem].push(null);
                    }
                };
                var getDias = function () {
                    scope.dias = [];
                    var mes = scope.puntero.getMonth();
                    var dia = new Date();
                    dia.setMonth(mes);
                    dia.setDate(1);
                    dia.setFullYear(scope.puntero.getFullYear());
                    dia = initDate(dia);
                    scope.dias.push(dia);
                    var nuevoDia = new Date(dia.getTime() + 86400000);
                    while (mes === nuevoDia.getMonth()) {
                        scope.dias.push(nuevoDia);
                        nuevoDia = new Date(nuevoDia.getTime() + 86400000);
                    }
                    getSemanas();
                };
                scope.cambiaMes = function (tipo) {
                    var mes = null;
                    var dia = null;
                    var ano = null;
                    switch (tipo) {
                        case -1:
                            mes = (scope.puntero.getMonth() === 0) ? 11 : scope.puntero.getMonth() - 1;
                            dia = 1;
                            ano = (mes === 11) ? scope.puntero.getFullYear() - 1 : scope.puntero.getFullYear();
                            break;
                        case 1:
                            mes = (scope.puntero.getMonth() === 11) ? 0 : scope.puntero.getMonth() + 1;
                            dia = 1;
                            ano = (mes === 0) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear();
                            break;
                        default:
                            return;
                    }
                    scope.puntero.setDate(dia);
                    scope.puntero.setMonth(mes);
                    scope.puntero.setFullYear(ano);
                    getMeses();
                    getDias();
                };
                scope.cambiaAno = function (ano) {
                    ano = (ano === 1) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear() - 1;
                    scope.puntero.setFullYear(ano);
                    getMeses();
                    getDias();
                };
                scope.claseDia = function (dia) {
                    return (dia !== null && getCadena(dia) === getCadena(ngModel.$modelValue)) ? "bg-success" : "";
                };
                var checkDay = function (dia) {
                    if (dia === null) {
                        return false;
                    }
                    if (min !== null && dia < min) {
                        return false;
                    }
                    if (max !== null && dia > max) {
                        return false;
                    }
                    if (Array.isArray(onlyAllowed) && onlyAllowed.indexOf(dia.getTime()) < 0) {
                        return false;
                    }
                    if (Array.isArray(notAllowed) && notAllowed.indexOf(dia.getTime()) >= 0) {
                        return false;
                    }
                    if (Array.isArray(onlyDays) && onlyDays.indexOf(dia.getDay()) < 0) {
                        return false;
                    }
                    if (Array.isArray(notDays) && notDays.indexOf(dia.getDay()) >= 0) {
                        return false;
                    }
                    return true;
                };
                scope.estiloDia = function (dia) {
                    if (!checkDay(dia)) {
                        return {
                            "color": "#999999"
                        };
                    }
                    else {
                        return {};
                    }
                };
                var capa = null;
                scope.activo = false;
                elem.attr("readonly", "true");
                elem.on("click", function () {
                    if (scope.activo) {
                        scope.$apply(function () {
                            esconder();
                        });
                    }
                    else {
                        scope.$apply(function () {
                            render();
                        });
                    }
                });
                scope.mouseover = function (ev, dia) {
                    if (!checkDay(dia)) {
                        return "";
                    }
                    angular.element(ev.target).addClass("bg-primary");
                };
                scope.mouseout = function (ev) {
                    angular.element(ev.target).removeClass("bg-primary");
                };
                var esconder = function () {
                    scope.activo = false;
                    angular.element(capa).remove();
                    capa = null;
                };
                var getDimensiones = function () {
                    var de = document.documentElement;
                    var box = elem[0].getBoundingClientRect();
                    var top = box.top + window.pageYOffset - de.clientTop;
                    var left = box.left + window.pageXOffset - de.clientLeft;
                    return { top: top, left: left };
                };
                var render = function () {
                    if (scope.puntero === null) {
                        scope.puntero = initDate();
                        getMeses();
                        getDias();
                    }
                    var dim = getDimensiones();
                    scope.top = dim.top + elem[0].offsetHeight;
                    scope.left = dim.left;
                    scope.width = elem[0].offsetWidth;
                    capa = _this.$compile(template)(scope);
                    angular.element(_this.$document[0].body).append(capa);
                    scope.activo = true;
                };
                scope.asignar = function (dia) {
                    if (!checkDay(dia)) {
                        return;
                    }
                    scope.puntero = dia;
                    ngModel.$setViewValue(new Date(dia.getTime()));
                    esconder();
                };
                scope.borrar = function () {
                    ngModel.$setViewValue(null);
                    scope.puntero = null;
                    esconder();
                };
                scope.$watch("min", function (nueva) {
                    min = (nueva === undefined || nueva === null) ? null : nueva;
                });
                scope.$watch("max", function (nueva) {
                    max = (nueva === undefined || nueva === null) ? null : nueva;
                });
                scope.$watch("onlyAllowed", function (nueva) {
                    var nuevas = [];
                    if (Array.isArray(nueva)) {
                        for (var i = 0; i < nueva.length; i++) {
                            nuevas[i] = initDate(nueva[i]).getTime();
                        }
                        onlyAllowed = nuevas;
                    }
                    else {
                        onlyAllowed = null;
                    }
                });
                scope.$watch("notAllowed", function (nueva) {
                    var nuevas = [];
                    if (Array.isArray(nueva)) {
                        for (var i = 0; i < nueva.length; i++) {
                            nuevas[i] = initDate(nueva[i]).getTime();
                        }
                        notAllowed = nuevas;
                    }
                    else {
                        notAllowed = null;
                    }
                });
                scope.$watch("onlyDays", function (nueva) {
                    onlyDays = (Array.isArray(nueva)) ? nueva : null;
                });
                scope.$watch("notDays", function (nueva) {
                    notDays = (Array.isArray(nueva)) ? nueva : null;
                });
                scope.$watch("ngModel", function (nueva) {
                    var tipo = Object.prototype.toString.call(nueva);
                    if (tipo === '[object Date]' && nueva !== null) {
                        scope.puntero = nueva;
                    }
                    else {
                        scope.puntero = initDate();
                    }
                    getMeses();
                    getDias();
                    aplicar();
                });
            };
        }
        Directive.factory = function () {
            var directiva = function ($compile, $document, $filter) { return new Directive($compile, $document, $filter); };
            directiva.$inject = ["$compile", "$document", "$filter"];
            return directiva;
        };
        return Directive;
    })();
    angular.module("dcDatePicker").directive("dcDatePicker", Directive.factory());
})(DatePicker || (DatePicker = {}));
