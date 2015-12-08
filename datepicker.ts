///<reference path="typings/angularjs/angular.d.ts" />

angular.module("dcDatePicker", []);

module DatePicker {

	interface IScopeDirectiva extends ng.IScope {
		ngModel: Date;
		dateType: string;
		min: Date;
		max: Date;
		range: boolean;
		top: number;
		left: number;
		width: number;
		activo: boolean;
		cambiaMes: (tipo: number) => void;
		cambiaAno: (ano: number) => void;
		asignar: (dia:Date) => void;
		borrar: () => void;
		mouseover: (ev: Event, dia:Date) => void;
		mouseout: (ev: Event) => void;
		claseDia: (dia: Date) => string;
		estiloDia: (dia: Date) => Object;
		meses: Array<Array<Date>>;
		dias: Array<Date>;
		diasCabecera: Array<Date>;
		semanas: Array<Array<Date>>;
		fechaIni: Date;
		fechaFin: Date;
	}

	class Directive {

		restrict = "A";
		scope = {
			dateType: "=",
			min: "=?",
			max: "=?"
		};

		require = "ngModel";


		link = (scope:IScopeDirectiva, elem:ng.IAugmentedJQuery, attrs:Array<Attr>, ngModel:ng.INgModelController) => {

			var getCadena = (dia:Date) : string => {
				if (dia === null) {
					return "";
				}

				var mes = dia.getMonth() + 1;
				var cadena = dia.getDate() + "-" + mes + "-" + dia.getFullYear();
				return cadena;
			}

			var aplicar = () => {
				var dia = ngModel.$modelValue;
				
				//ngModel.$setViewValue(cadena);
				elem.val(getCadena(dia));
				//ngModel.$render();
			}

			if (Object.prototype.toString.call(ngModel.$modelValue) !== "[object Date]") {
				var fecha = new Date();
				fecha.setHours(0);
				fecha.setMinutes(0);
				fecha.setSeconds(0);
				fecha.setMilliseconds(0);

				if (scope.dateType === "month") {
					fecha.setDate(1);
				}
				ngModel.$setViewValue(fecha);

				aplicar();
			}

			var template = `
				<div style="position:absolute;display:block;background-color:white;left:{{left}}px;top:{{top}}px;min-width:{{width}}px;padding:10px;box-shadow:0 3px 3px rgba(0,0,0,0.5);z-index:1000;">
					<div class="container-fluid">
						<div class="row bg-primary" style="margin-left:-25px;margin-right:-25px;margin-top:-10px;">
							<!--Mostramos la fila que contiene los años-->
							<div class="col-xs-4" style="padding:10px;text-align:left;cursor:pointer;" ng-click="cambiaAno(-1)">
								<span class="glyphicon glyphicon-arrow-left"></span>
							</div>
							<div class="col-xs-4" style="padding:10px;text-align:center;">
								{{ngModel | date : 'yyyy'}}
							</div>
							<div class="col-xs-4" style="padding:10px;text-align:right;cursor:pointer;" ng-click="cambiaAno(1)">
								<span class="glyphicon glyphicon-arrow-right"></span>
							</div>
						</div>
						<div class="row bg-warning" ng-show="dateType === 'day'" style="margin-left:-25px;margin-right:-25px;">
							<!-- Ahora la fila que contendrá el paso del més (si no es vista de meses) -->
							<div class="col-xs-4" style="padding:10px;text-align:left;cursor:pointer" ng-click="cambiaMes(-1)">
								<span class="glyphicon glyphicon-arrow-left"></span>
							</div>
							<div class="col-xs-4" style="padding:10px;text-align:center;">
								{{ngModel | date:'MMMM'}}
							</div>
							<div class="col-xs-4" style="padding:10px;text-align:right;cursor:pointer" ng-click="cambiaMes(1)">
								<span class="glyphicon glyphicon-arrow-right"></span>
							</div>
						</div>
						<table class="table" ng-if="dateType==='month'">
							<!-- Ahora las filas de los meses (en caso de que sea vista tipo mes) -->
							<tr ng-repeat="mes in meses">
								<td ng-repeat="dia in mes" ng-style="estiloDia(dia)" ng-class="claseDia(dia)" ng-click="asignar(dia)" style="cursor:pointer;text-align:center;" ng-mouseover="mouseover($event, dia)" ng-mouseleave="mouseout($event)">{{dia | date:'MMM'}}</td>
							</tr>
						</div>
						<!-- Ahora en caso de que sea fecha de tipo día lo mostramos como una tabla -->
						<table class="table" ng-if="dateType === 'day'">
							<tr>
								<th ng-repeat="dia in diasCabecera track by $index" style="text-align:center;">{{dia | date : 'EEE'}}</th>
							</tr>
							<tr ng-repeat="semana in semanas track by $index">
								<td ng-repeat="dia in semana track by $index" ng-style="estiloDia(dia)" ng-class="claseDia(dia)" ng-click="asignar(dia)" style="cursor:pointer;text-align:center;" ng-mouseover="mouseover($event, dia)" ng-mouseleave="mouseout($event)">{{dia | date:'d'}}</td>
							</tr>
						</table>
						<div class="btn-group">
							<button class="btn-default btn btn-sm" ng-click="borrar()">Borrar</button>
						</div>
					</div>
				</div>
			`;

			elem.css("cursor", "pointer");

			scope.ngModel = ngModel.$modelValue;

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

			var getMeses = () => {

				scope.meses = [];

				var ano = scope.ngModel.getFullYear();
				var m = 0; 

				for (var i = 0; i < 12; i++) {
					var nuevoMes: Date = new Date();
					nuevoMes.setFullYear(ano);
					nuevoMes.setMonth(i);
					nuevoMes.setDate(1);
					nuevoMes.setHours(0);
					nuevoMes.setMinutes(0);
					nuevoMes.setSeconds(0);
					nuevoMes.setMilliseconds(0);

					if (i % 3 === 0 && i !== 0) {
						m++;
					}
					scope.meses[m] = (scope.meses[m] !== undefined) ? scope.meses[m] : [];
					scope.meses[m].push(nuevoMes);

				}
			};

			var getDiaSemana = (dia: number) => {
				return (dia === 0) ? 6 : dia - 1;
			}

			var getSemanas = () => {

				scope.semanas = [];

				// Ahora buscamos el primer día y vemos que día de la semana es:
				var diaSemana = getDiaSemana(scope.dias[0].getDay());

				var sem = 0;

				for (var i = 0; i < diaSemana; i++) {
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(null);
				}
				// Ahora empezamos a recorrer el bucle
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
			}


			var getDias = () => {
				scope.dias = [];

				var mes = scope.ngModel.getMonth();
				
				// Definimos el día 1
				var dia = new Date();
				dia.setMonth(mes);
				dia.setDate(1);
				dia.setFullYear(scope.ngModel.getFullYear());
				dia.setHours(0);
				dia.setMinutes(0);
				dia.setSeconds(0);
				dia.setMilliseconds(0);
				scope.dias.push(dia);

				var nuevoDia = new Date(dia.getTime() + 86400000);

				while (mes === nuevoDia.getMonth()) {
					scope.dias.push(nuevoDia);
					nuevoDia = new Date(nuevoDia.getTime() + 86400000);
				}

				getSemanas();
			}

			scope.cambiaMes = (tipo: number) => {

				switch (tipo) {
					case -1:
						// Mes anterior:
						var mes = (scope.ngModel.getMonth() === 0) ? 11 : scope.ngModel.getMonth() - 1;
						var dia = 1;
						var ano = (mes === 11) ? scope.ngModel.getFullYear() - 1 : scope.ngModel.getFullYear();
						scope.ngModel = new Date();
						scope.ngModel.setMonth(mes);
						scope.ngModel.setDate(1);
						scope.ngModel.setFullYear(ano);
						break;
					case 1:
						// Mes siguiente:
						var mes = (scope.ngModel.getMonth() === 11) ? 0 : scope.ngModel.getMonth() + 1;
						var dia = 1;
						var ano = (mes === 0) ? scope.ngModel.getFullYear() + 1 : scope.ngModel.getFullYear();
						scope.ngModel = new Date();
						scope.ngModel.setMonth(mes);
						scope.ngModel.setDate(1);
						scope.ngModel.setFullYear(ano);
						break;
				}
			};

			scope.cambiaAno = (ano) => {
				ano = (ano === 1) ? scope.ngModel.getFullYear() + 1 : scope.ngModel.getFullYear() - 1;
				scope.ngModel.setFullYear(ano);
				getMeses();
				getDias();
			}


			scope.claseDia = (dia) => {
				return (dia !== null && getCadena(dia) === getCadena(ngModel.$modelValue)) ? "bg-success" : "";
			}

			scope.estiloDia = (dia) => {
				if ((scope.min !== null) && dia < scope.min || (scope.max !== null && dia > scope.max)) {
					return {
						"color": "#999999"
					}
				} else {
					return {};
				}
			}


			var capa:ng.IAugmentedJQuery = null;
			scope.activo = false;
			elem.attr("readonly", "true");

			elem.on("click", () => {
				if (scope.activo) {
					// Lo ocultamos
					scope.$apply(() => {
						esconder();
					});					
				} else {
					scope.$apply(() => {
						render();
					});		
				}
				
			});

			scope.mouseover = (ev, dia) => {
				if ((scope.min !== null) && dia < scope.min || (scope.max !== null && dia > scope.max)) {
					return "";
				}
				angular.element(ev.target).addClass("bg-primary");
			}

			scope.mouseout = (ev) => {
				angular.element(ev.target).removeClass("bg-primary");
			}

			var esconder = () => {
				angular.element(capa).remove();
				capa = null;
				scope.activo = false;
			};

			var getDimensiones = () => {

				var de = document.documentElement;
				var box = elem[0].getBoundingClientRect();
				var top = box.top + window.pageYOffset - de.clientTop;
				var left = box.left + window.pageXOffset - de.clientLeft;
				return { top: top, left: left };
			}

			var render = () => {
				// Obtenemos el alto y ancho del elemento
				var dim = getDimensiones();

				//scope.top = elem[0].offsetHeight - 1;
				//scope.left = elem[0].offsetLeft;
				
				scope.top = dim.top + elem[0].offsetHeight;
				scope.left = dim.left;

				scope.width = elem[0].offsetWidth;

				capa = this.$compile(template)(scope);
				//elem.parent().append(capa);
				angular.element(this.$document[0].body).append(capa);

				scope.activo = true;
			}

			scope.asignar = (dia) => {

				if ((scope.min !== null && dia < scope.min) || (scope.max !== null && dia > scope.max)) {
					return;
				}

				ngModel.$setViewValue(dia);
				aplicar();
				esconder();
			}

			scope.borrar = () => {
				ngModel.$setViewValue(null);
				aplicar();
				esconder();
			}			

			

			scope.$watch("ngModel", (nueva) => {
				if (nueva !== undefined) {
					getMeses();
					getDias();
				}
			});

			scope.$watch("min", (nueva: Date) => {
				scope.min = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("max", (nueva: Date) => {
				scope.max = (nueva === undefined || nueva === null) ? null : nueva;
			});
		}

		constructor (private $compile:ng.ICompileService, private $document:ng.IDocumentService) {}

		static factory () : ng.IDirectiveFactory {
			const directiva = ($compile:ng.ICompileService, $document:ng.IDocumentService) => new Directive($compile, $document);
			directiva.$inject = ["$compile", "$document"];
			return directiva;
		}
	}

	angular.module("dcDatePicker").directive("dcDatePicker", Directive.factory());
}