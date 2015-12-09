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
		isOpen: boolean;					// Variable que determina si el calendario está abierto o no
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
		notAllowed: Array<number>;
		onlyAllowed: Array<number>;
		notDays: Array<number>;
		onlyDays: Array<number>;
	}

	class Directive {

		// Restringimos la directiva al tipo atributo
		restrict = "A";

		// Declaramos las variables que recogeremos de la directiva y registraremos en el scope
		scope = {
			ngModel: "=",
			dateType: "=",	// El tipo de calendario (day|month)
			min: "=?",		// La fecha mínima
			max: "=?",		// la fecha máxima
			format: "@?", 	// Formato de la fecha
			notAllowed: "=?", // Array con las fechas no permitidas
			onlyAllowed: "=?", // Array con las únicas fechas que son seleccionables
			onlyDays: "=?", // Array con los días de la semana que son permitidos
			notDays: "=?", // Array con los días de la semana que están prohibidos
			isOpen: "=?"	// Para poder abrir el calendario de forma externa
		};


		// Es necesaria la directiva ngModel (para poder establecer la fecha)
		require = "ngModel";


		// Función de lincado
		link = (scope: IScopeDirectiva, elem: ng.IAugmentedJQuery, attrs: Array<Attr>, ngModel: ng.INgModelController) => {

			// Definimos las variables de filtrado para evitar disparar el $digest a la hora de asignarlas
			var max: Date = null;
			var min : Date = null;
			var notAllowed:Array<number> = null;
			var onlyAllowed:Array<number> = null;
			var notDays:Array<number> = null;
			var onlyDays:Array<number> = null;
			var abierto: boolean = false;


			/**
			 * Función que devuelve una fecha que comienza en el principio del día (a las 00:00:00 000ms)
			 * Si se pasa como argumento una fecha, ésta se establece al principio del día
			 * @type {Date}
			 */
			var initDate = (fecha?:Date) : Date => {
				var tipo = Object.prototype.toString.call(fecha);
				fecha = (tipo !== '[object Date]') ? new Date() : fecha;
				fecha.setMilliseconds(0);
				fecha.setHours(0);
				fecha.setMinutes(0);
				fecha.setSeconds(0);
				return fecha;
			};


			/**
			 * Función que devuelve la cadena de fecha formateada según lo configurado en scope.format
			 * Recordemos que el formato se define según los parámetros admitidos por el filtro "date" de angular
			 * @type {[type]}
			 */
			var getCadena = (dia:Date) : string => {
				// En caso de que la fecha sea null, devolvemos una cadena vacía
				if (dia === null) {
					return "";
				}

				// En caso de que no se haya definido un formato predeterminado, seteamos uno por defecto
				if (!scope.format) {
					scope.format = "d/MM/yyyy";
				}
				
				return this.$filter("date")(dia, scope.format);
			}

			/**
			 * Con esta función aplicamos el formato de la fecha en la casilla del input.
			 * Esto es solo para la vista del usuario. Realmente el valor de tipo fecha se almacena en
			 * ngModel.$modelValue
			 * @type {[type]}
			 */
			var aplicar = () => {
				var dia = ngModel.$modelValue;
				elem.val(getCadena(dia));
			}

			/*
				Definimos la plantilla que utilizaremos en la directiva.
				Así no tenemos que recurrir a un fichero externo
			 */
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

			// Para que el usuario sepa que debe hacer click en la casilla de fecha,
			// cambiamos la forma del cursor a 'pointer'
			elem.css("cursor", "pointer");

			// Ahora vamos a setear los dias de la cabecera. Para que éstos se puedan formatear con el filtro 'date'
			// y a su vez sea compatible con las librerías de idiomas locales de angular, los días deben estar en formato
			// date
			// TODO en un futuro hay que encapsular esto dentro de una función. No es buena idea tener código por aquí suelto
			scope.diasCabecera = [];

			// Escogemos un día cualquiera, eso sí, que sea lunes
			var dia = new Date();
			dia.setMonth(11);
			dia.setFullYear(2003);
			dia.setDate(1);
			dia.setHours(0);
			dia.setMinutes(0);
			dia.setSeconds(0);
			dia.setMilliseconds(0);

			scope.diasCabecera.push(dia);

			// Añadimos el resto de días de la semana
			for (var i = 0; i < 6; i++) {
				var dia = new Date(dia.getTime() + 86400000);
				scope.diasCabecera.push(dia);
			}


			/**
			 * Función que obtiene los meses de la selección actual.
			 * Esta función es llamada siempre que seleccionamos un día del calendario
			 * o cuando cambiamos de més o año.
			 *
			 * Así tendremos en un array (scope.meses) los meses del año actual por si los
			 * necesitamos en la vista mes.
			 * @type {[type]}
			 */
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

			/**
			 * Como javascript enumera los días de la semana de 0 a 6, siendo 0 el domingo.
			 * Esta función nos devolverá el día de la semana correspondiente siendo 0 el lunes y 6 el domingo
			 *
			 * Tan solo la vamos a usar para los loops internos de las funciones
			 * @type {[type]}
			 */
			var getDiaSemana = (dia: number) => {
				return (dia === 0) ? 6 : dia - 1;
			}

			/**
			 * Como el calendario se estructura en una tabla en la que cada fila es una semana que tiene 7 columnas (los días)
			 * Para hacer más fácil el manejo de los bucles en la directiva, haremos un array de semanas, en el que cada elemento
			 * será a su vez un array con los días de esa semana
			 *
			 * Esta función será llamada cada vez que cambiemos de més o de año
			 * 
			 * @type {[type]}
			 */
			var getSemanas = () => {

				// Vaciamos el array de semanas
				scope.semanas = [];

				// Ahora buscamos el primer día y vemos que día de la semana es:
				var diaSemana = getDiaSemana(scope.dias[0].getDay());

				// Como todas las filas (semanas) empiezan por lunes, (día 0). En caso de que
				// mes actual no comience por lunes, debemos rellenar los días.
				// TODO en el futuo pondremos los días del mes anterior en gris
				var sem = 0;

				for (var i = 0; i < diaSemana; i++) {
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(null);
				}


				// Ahora empezamos a recorrer el array de los días para ir añadiendo cada día en su semana
				for (var d = 0; d < scope.dias.length; d++) {
					diaSemana = getDiaSemana(scope.dias[d].getDay());

					// Si el día de la semana es 0, significa que es lunes, por lo que pasamos a la siguiente semana.
					sem = (diaSemana === 0) ? sem + 1 : sem;
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(scope.dias[d]);
				}


				// Lo mismo que hemos hecho antes rellenando los días previos al inicio del mes, lo hacemos ahora
				// para completar los días que queden hasta finalizar el mes en esa semana
				for (var i = 6; i > diaSemana; diaSemana++) {
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(null);
				}
			}


			/**
			 * Funcíón para obtener los días del més actual.
			 * Se almacenan todos en un array "scope.dias", que posteriormente emplearemos en la función
			 * getSemanas() para almacenarlos en los arrays de semanas
			 * @type {[type]}
			 */
			var getDias = () => {
				scope.dias = [];

				var mes = scope.puntero.getMonth();
				
				// Definimos el día 1 del més
				var dia = new Date();
				dia.setMonth(mes);
				dia.setDate(1);
				dia.setFullYear(scope.puntero.getFullYear());
				dia = initDate(dia);
				scope.dias.push(dia);

				// Para calcular el día siguiente creamos un nuevo día
				// y le sumamos los segundos que hay en 24 horas
				var nuevoDia = new Date(dia.getTime() + 86400000);

				// Creamos un bucle que finalizará cuando el mes cambie
				// momento en el que habremos terminado de generar todos los días
				// del més en curso
				while (mes === nuevoDia.getMonth()) {
					scope.dias.push(nuevoDia);
					nuevoDia = new Date(nuevoDia.getTime() + 86400000);
				}

				// Llamamos a la función getSemanas para almacenar los días en los arrays de semanas
				getSemanas();
			}

			/**
			 * Método para cambiar el mes en curso
			 * Si el parámetro que pasamos es -1 significa que queremos ir un mes atrás
			 * Si el parámetro que pasamos es 1 significa que queremos ir un mes adelante
			 * Si no es ninguno de esos valores, 
			 * @type {[type]}
			 */
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
					default:
						return;
				}

				// Guaramos el día actualizado y calculamos el més
				scope.puntero.setDate(dia);
				scope.puntero.setMonth(mes);
				scope.puntero.setFullYear(ano);
				getMeses();
				getDias();
			};

			/**
			 * Método para cambiar de año
			 * Al igual que el mes, si el parámetro es 1 pasamos al año siguiente
			 * Si el parámetro es 0 vamos al año anterior.
			 * @type {[type]}
			 */
			scope.cambiaAno = (ano) => {
				ano = (ano === 1) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear() - 1;
				
				// Actualizamos la fecha y calculamos los meses y días para actualizar la vista
				scope.puntero.setFullYear(ano);
				getMeses();
				getDias();
			}

			/**
			 * Método para calcular el estilo visual de un día. Si el día está seleccionado lo marcamos en verde
			 * @type {[type]}
			 */
			scope.claseDia = (dia) => {
				return (dia !== null && getCadena(dia) === getCadena(ngModel.$modelValue)) ? "bg-success" : "";
			}


			/**
			 * Función para chequear que el día sea correcto teniendo en cuenta los filtros por los que debe pasar
			 * @type {[type]}
			 */
			var checkDay = (dia:Date) : boolean => {
				if (dia === null) {
					return false;
				}

				// Primero comprobamos que el día esté entre el mínimo
				if (min !== null && dia < min) {
					return false;
				}
				// Ahora comprobamos que no esté fuera del máximo
				if (max !== null && dia > max) {
					return false;
				}

				// Ahora comprobamos que el día esté dentro de los permitidos
				if (Array.isArray(onlyAllowed) && onlyAllowed.indexOf(dia.getTime()) < 0) {
					return false;
				}

				// Ahora comprobamos que no esté en los días permitidos
				if (Array.isArray(notAllowed) && notAllowed.indexOf(dia.getTime()) >= 0) {
					return false;
				}

				// Ahora comprobamos que esté dentro de los días de la semana permitidos
				if (Array.isArray(onlyDays) && onlyDays.indexOf(dia.getDay()) < 0) {
					return false;
				}

				// Ahora comprobamos que no esté dentro de los días de la semana prohibidos
				if (Array.isArray(notDays) && notDays.indexOf(dia.getDay()) >= 0) {
					return false;
				}

				// Si llegamos hasta aquí es que todos los test se han superado
				return true;
			};

			/**
			 * Calculamos el estilo de un día en base a los criterios restrictivos que se han definido en el scope
			 * - Solo los días permitidos
			 * - Excluyendo los días prohibidos
			 * - Etc...
			 *
			 * TODO pendiente
			 * @type {[type]}
			 */
			scope.estiloDia = (dia) => {
				if (!checkDay(dia)) {
					return {
						"color": "#999999"
					}
				} else {
					return {};
				}
			}
			

			//Definimos el elemento que contendrá el HTML
			var capa:ng.IAugmentedJQuery = null;
			scope.activo = false;

			// Establecemos el input a readonly
			elem.attr("readonly", "true");

			// Cuando el usuario haga click en el cuadro de texto, renderizaremos el calendario o lo ocultaremos
			elem.on("click", () => {
				if (abierto) {
					// Lo ocultamos
					scope.$apply(() => {
						scope.isOpen = false;
						esconder();
					});					
				} else {
					scope.$apply(() => {
						scope.isOpen = true;
						render();
					});		
				}
				
			});


			scope.mouseover = (ev, dia) => {
				if (!checkDay(dia)) {
					return "";
				}
				angular.element(ev.target).addClass("bg-primary");
			}

			scope.mouseout = (ev) => {
				angular.element(ev.target).removeClass("bg-primary");
			}

			var esconder = () => {
				abierto = false;
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
				if (abierto) {
					return;
				}
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
				abierto = true;
			}

			scope.asignar = (dia) => {

				if (!checkDay(dia)) {
					return;
				}
				scope.puntero = dia;
				ngModel.$setViewValue(new Date(dia.getTime()));
				//aplicar();
				esconder();
			}

			scope.borrar = () => {
				ngModel.$setViewValue(null);
				scope.puntero = null;
				esconder();
			}			

			
			scope.$watch("min", (nueva: Date) => {
				min = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("max", (nueva: Date) => {
				max = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("onlyAllowed", (nueva:Array<Date>) => {
				var nuevas : Array<number> = [];
				if (Array.isArray(nueva)) {
					for (var i = 0; i < nueva.length; i++) {
						nuevas[i] = initDate(nueva[i]).getTime();
					}
					onlyAllowed = nuevas;
				} else {
					onlyAllowed = null;
				}
			});

			scope.$watch("notAllowed", (nueva:Array<Date>) => {
				var nuevas : Array<number> = [];
				if (Array.isArray(nueva)) {
					for (var i = 0; i < nueva.length; i++) {
						nuevas[i] = initDate(nueva[i]).getTime();
					}
					notAllowed = nuevas;
				} else {
					notAllowed = null;
				}
			});

			scope.$watch("onlyDays", (nueva:Array<number>) => {
				onlyDays = (Array.isArray(nueva)) ? nueva : null;
			});

			scope.$watch("notDays", (nueva:Array<number>) => {
				notDays = (Array.isArray(nueva)) ? nueva : null;
			});

			scope.$watch("isOpen", (nueva:boolean) => {
				if (nueva === true) {
					render();
				} else {
					esconder();
				}
			});

			scope.$watch("ngModel", (nueva:Date) => {
				var tipo = Object.prototype.toString.call(nueva);

				if (tipo === '[object Date]' && nueva !== null) {
					scope.puntero = nueva;
				} else {
					scope.puntero = initDate();
				}

				getMeses();
				getDias();
				aplicar();
			});
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