///<reference path="typings/angularjs/angular.d.ts" />

angular.module("dcDatePicker", []);

module DatePicker {

	/**
	 * Definimos la interface del scope que tendremos en la directiva
	 */
	interface IScopeDirectiva extends ng.IScope {
		puntero: Date; 			// Es un puntero que mantiene la fecha interna que tenemos seleccionada (temporalmente);
		dateType: string;		// El tipo de calendario que se mostrará (day|month)
		min: Date;				// La fecha mínima que se puede seleccionar
		max: Date; 				// La fecha máxima que se puede seleccionar
		format: string;			// Formato con el que se renderizará la fecha (compatible con el filtro date de angular)
		range: boolean;			// Desactivado
		top: number;			// La distancia hasta el marco superior de la ventana (teniendo en cuenta el scroll)
		left: number;			// Igual que el top, pero desde el borde izquierdo de la ventana
		width: number;			// El ancho del calendario (de momento no lo usamos)
		activo: boolean;		// Define si el calendario está activo o no (en un futuro se usará la propiedad disabled)
		cambiaMes: (tipo: number) => void; // Función para cambiar el més del calendario
		cambiaAno: (ano: number) => void; 	// Función para cambiar el año del calendario
		asignar: (dia:Date) => void;		// Método para asignar la fecha que hemos seleccionado
		borrar: () => void; 				// Método para borrar la fecha del calendario
		mouseover: (ev: Event, dia:Date) => void; 	// Método para cambiar el estilo del día/mes cuando pasa el ratón por encima
		mouseout: (ev: Event) => void; 				// Método para dejar el estilo como estaba cuando el ratón se marcha
		claseDia: (dia: Date) => string;			// Método que define la clase del día, si es el día actualmente seleccionado es en fondo verde
		estiloDia: (dia: Date) => Object;			// Método que define el estilo del día, se emplea para dar estilo desactivado a los días no permitidos
		meses: Array<Array<Date>>;					// Array con los meses del año en curso
		dias: Array<Date>;							// Array con los días del mes en curso
		diasCabecera: Array<Date>;					// Array con los días de la semana
		semanas: Array<Array<Date>>;				// Array con los días de cada semana del mes
		fechaIni: Date;								// Fecha de inicio del rango a seleccionar (de momento desactivado)
		fechaFin: Date;								// Fecha de fin del rango a seleccionar (de momento desactivado);
	}

	class Directive {

		// Restringimos la directiva al tipo atributo
		restrict = "A";

		// Declaramos las variables que recogeremos de la directiva y registraremos en el scope
		scope = {
			dateType: "=",	// El tipo de calendario (day|month)
			min: "=?",		// La fecha mínima
			max: "=?",		// la fecha máxima
			format: "@?" 	// Formato de la fecha
		};


		// Es necesaria la directiva ngModel (para poder establecer la fecha)
		require = "ngModel";


		// Función de lincado
		link = (scope: IScopeDirectiva, elem: ng.IAugmentedJQuery, attrs: Array<Attr>, ngModel: ng.INgModelController) => {

			/**
			 * Función que devuelve una fecha que comienza en el principio del día (a las 00:00:00 000ms)
			 * Si se pasa como argumento una fecha, ésta se establece al principio del día
			 * @type {Date}
			 */
			var initDate = (fecha?:Date) : Date => {

				fecha = (fecha === undefined) ? new Date() : fecha;
				fecha.setMilliseconds(0);
				fecha.setHours(0);
				fecha.setMinutes(0);
				fecha.setSeconds(0);
				return fecha;
			};



			var getCadena = (dia:Date) : string => {
				if (dia === null) {
					return "";
				}

				if (!scope.format) {
					scope.format = "d/MM/yyyy";
				}
				
				return this.$filter("date")(dia, scope.format);
			}

			var aplicar = () => {
				var dia = ngModel.$modelValue;
				elem.val(getCadena(dia));
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
								{{puntero | date : 'yyyy'}}
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
								{{puntero | date:'MMMM'}}
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

				var ano = scope.puntero.getFullYear();
				var m = 0; 

				for (var i = 0; i < 12; i++) {
					var nuevoMes: Date = new Date();
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

				var mes = scope.puntero.getMonth();
				
				// Definimos el día 1
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
			}

			scope.cambiaMes = (tipo: number) => {

				var mes: number = null;
				var dia: number = null;
				var ano: number = null;

				switch (tipo) {
					case -1:
						// Mes anterior:
						mes = (scope.puntero.getMonth() === 0) ? 11 : scope.puntero.getMonth() - 1;
						dia = 1;
						ano = (mes === 11) ? scope.puntero.getFullYear() - 1 : scope.puntero.getFullYear();
						break;
					case 1:
						// Mes siguiente:
						mes = (scope.puntero.getMonth() === 11) ? 0 : scope.puntero.getMonth() + 1;
						dia = 1;
						ano = (mes === 0) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear();
						break;
				}

				scope.puntero.setDate(dia);
				scope.puntero.setMonth(mes);
				scope.puntero.setFullYear(ano);
				getMeses();
				getDias();
			};

			scope.cambiaAno = (ano) => {
				ano = (ano === 1) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear() - 1;
				scope.puntero.setFullYear(ano);
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
				scope.activo = false;
				angular.element(capa).remove();
				capa = null;				
			};

			var getDimensiones = () => {

				var de = document.documentElement;
				var box = elem[0].getBoundingClientRect();
				var top = box.top + window.pageYOffset - de.clientTop;
				var left = box.left + window.pageXOffset - de.clientLeft;
				return { top: top, left: left };
			}

			var render = () => {
				if (scope.puntero === null) {
					scope.puntero = initDate();
					getMeses();
					getDias();
				}
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
				scope.puntero = dia;
				ngModel.$setViewValue(new Date(dia.getTime()));
				aplicar();
				esconder();
			}

			scope.borrar = () => {
				ngModel.$setViewValue(null);
				scope.puntero = null;
				aplicar();
				esconder();
			}			

			
			scope.$watch("min", (nueva: Date) => {
				scope.min = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("max", (nueva: Date) => {
				scope.max = (nueva === undefined || nueva === null) ? null : nueva;
			});


			if (isNaN(ngModel.$modelValue)) {
				ngModel.$setViewValue(null);
				scope.puntero = initDate();
			}

			getMeses();
			getDias();
			aplicar();
		}

		constructor (private $compile:ng.ICompileService, private $document:ng.IDocumentService, private $filter:ng.IFilterService) {}

		static factory () : ng.IDirectiveFactory {
			const directiva = ($compile:ng.ICompileService, $document:ng.IDocumentService, $filter:ng.IFilterService) => new Directive($compile, $document, $filter);
			directiva.$inject = ["$compile", "$document", "$filter"];
			return directiva;
		}
	}

	angular.module("dcDatePicker").directive("dcDatePicker", Directive.factory());
}