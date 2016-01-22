///<reference path="typings/angularjs/angular.d.ts" />

angular.module("dcDatePicker", []);

module DatePicker {

	/**
	 * Definimos la interface del scope que tendremos en la directiva
	 */
	interface IScopeDirectiva extends ng.IScope {
		puntero: Date; 			// es un puntero que mantiene la fecha interna que tenemos seleccionada (temporalmente);
		dateType: string;		// el tipo de calendario que se mostrará (day|month)
		hour?: boolean;         // si este valor es true, el usuario podrá especificar la hora del día también
		min: Date;				// la fecha mínima que se puede seleccionar
		max: Date; 				// la fecha máxima que se puede seleccionar
		format: string;			// formato con el que se renderizará la fecha (compatible con el filtro date de angular)
		range: boolean;			// desactivado
		top: number;			// la distancia hasta el marco superior de la ventana (teniendo en cuenta el scroll)
		left: number;			// igual que el top, pero desde el borde izquierdo de la ventana
		width: number;			// el ancho del calendario (de momento no lo usamos)
		activo: boolean;		// define si el calendario está activo o no (en un futuro se usará la propiedad disabled)
		cambiaMes: (tipo: number) => void; // función para cambiar el més del calendario
		cambiaAno: (ano: number) => void; 	// función para cambiar el año del calendario
		asignar: (dia: Date) => void;		// método para asignar la fecha que hemos seleccionado
		intHora: number;                    // hora actual seleccionada
		intMinutos: number;                 // minutos actuales seleccionados
		setHora: ($event: ng.IAngularEvent) => void;
		setMinutes: ($event: ng.IAngularEvent) => void;
		asignarHora: () => void;               // método que sustituye a asignar() cuando se activa la hora
		isOpen: boolean;					// variable que determina si el calendario está abierto o no
		borrar: () => void; 				// método para borrar la fecha del calendario
		mouseover: (ev: Event, dia: Date) => void; 	// método para cambiar el estilo del día/mes cuando pasa el ratón por encima
		mouseout: (ev: Event) => void; 				// método para dejar el estilo como estaba cuando el ratón se marcha
		claseDia: (dia: Date) => string;			// método que define la clase del día, si es el día actualmente seleccionado es en fondo verde
		estiloDia: (dia: Date) => Object;			// método que define el estilo del día, se emplea para dar estilo desactivado a los días no permitidos
		meses: Array<Array<Date>>;					// array con los meses del año en curso
		dias: Array<Date>;							// array con los días del mes en curso
		diasCabecera: Array<Date>;					// array con los días de la semana
		semanas: Array<Array<Date>>;				// array con los días de cada semana del mes
		fechaIni: Date;								// fecha de inicio del rango a seleccionar (de momento desactivado)
		fechaFin: Date;								// fecha de fin del rango a seleccionar (de momento desactivado);
		notAllowed: Array<number>;
		onlyAllowed: Array<number>;
		notDays: Array<number>;
		onlyDays: Array<number>;
	}

	class Directive {

		// restringimos la directiva al tipo atributo
		public restrict: string = "A";

		// declaramos las variables que recogeremos de la directiva y registraremos en el scope
		public scope: any = {
			ngModel: "=",
			dateType: "=",	// el tipo de calendario (day|month)
			hour: "=?",      // definiremos si también se adjunta la hora de la fecha (solo compatible con la vista día)
			min: "=?",		// la fecha mínima
			max: "=?",		// la fecha máxima
			format: "@?", 	// formato de la fecha
			notAllowed: "=?", // array con las fechas no permitidas
			onlyAllowed: "=?", // array con las únicas fechas que son seleccionables
			onlyDays: "=?", // array con los días de la semana que son permitidos
			notDays: "=?", // array con los días de la semana que están prohibidos
			isOpen: "=?",	// para poder abrir el calendario de forma externa
		};


		// es necesaria la directiva ngModel (para poder establecer la fecha)
		public require: string = "ngModel";


		// función de lincado
		public link: Function = (scope: IScopeDirectiva, elem: ng.IAugmentedJQuery, attrs: Array<Attr>, ngModel: ng.INgModelController) => {

			// definimos las variables de filtrado para evitar disparar el $digest a la hora de asignarlas
			let max: Date = null;
			let min: Date = null;
			let notAllowed: Array<number> = null;
			let onlyAllowed: Array<number> = null;
			let notDays: Array<number> = null;
			let onlyDays: Array<number> = null;
			let abierto: boolean = false;
			let hora: boolean = false;

			scope.intHora = null;
			scope.intMinutos = null;


			/**
			 * Función que devuelve una fecha que comienza en el principio del día (a las 00:00:00 000ms)
			 * Si se pasa como argumento una fecha, ésta se establece al principio del día
			 * @type {Date}
			 */
			let initDate: Function = (fecha?: Date) : Date => {
				let tipo: string = Object.prototype.toString.call(fecha);
				fecha = (tipo !== "[object Date]" || fecha === null) ? new Date() : fecha;

				// si no queremos establecera la hora, reseteamos el día a la hora 0, si no, lo dejamos como está
				if (!hora) {
					fecha.setMilliseconds(0);
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);
				}
				return fecha;
			};


			/**
			 * Función que devuelve la cadena de fecha formateada según lo configurado en scope.format
			 * Recordemos que el formato se define según los parámetros admitidos por el filtro "date" de angular
			 * @type {[type]}
			 */
			let getCadena: Function = (dia: Date) : string => {
				// en caso de que la fecha sea null, devolvemos una cadena vacía
				if (dia === null) {
					return "";
				}

				// en caso de que no se haya definido un formato predeterminado, seteamos uno por defecto
				if (!scope.format) {
					scope.format = "d/MM/yyyy";
				}

				return this.$filter("date")(dia, scope.format);
			};

			let mismoDia: Function = (fecha1: Date, fecha2: Date): boolean => {
				let f1: Date = new Date(fecha1.getTime());
				let f2: Date = new Date(fecha2.getTime());

				f1.setHours(0);
				f1.setMilliseconds(0);
				f1.setMinutes(0);
				f1.setSeconds(0);

				f2.setHours(0);
				f2.setMilliseconds(0);
				f2.setMinutes(0);
				f2.setSeconds(0);

				return (f1.getTime() === f2.getTime());
			};

			/**
			 * Con esta función aplicamos el formato de la fecha en la casilla del input.
			 * Esto es solo para la vista del usuario. Realmente el valor de tipo fecha se almacena en
			 * ngModel.$modelValue
			 * @type {[type]}
			 */
			let aplicar: Function = () => {
				let dia: Date = ngModel.$modelValue;
				elem.val(getCadena(dia));
			};

			/*
				Definimos la plantilla que utilizaremos en la directiva.
				Así no tenemos que recurrir a un fichero externo
			 */
			let template: string = `
				<div style="position:absolute;display:block;background-color:white;left:{{left}}px;top:{{top}}px;min-width:{{width}}px;max-width:400px;padding:10px;box-shadow:0 3px 3px rgba(0,0,0,0.5);z-index:1000;">
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
						<table class="table" ng-if="hour">
							<tr>
								<td style="text-align:right;">
									<div class="input-group">
										<span class="input-group-addon">Hora</span>
										<input type="number" class="form-control" ng-model="intHora" ng-blur="setHora($event)">
									</div>
								</td>
								<td style="text-align:left;">
									<div class="input-group">
										<input type="number" class="form-control" ng-model="intMinutos" ng-blur="setMinutes($event)">
										<span class="input-group-addon">Min</span>
									</div>
								</td>
							</tr>
						</table>
						<div class="btn-group" style="margin-top:15px;">
							<button class="btn-default btn btn-sm" ng-click="borrar()">Borrar</button>
							<button class="btn btn-primary btn-sm" ng-click="asignarHora()">Asignar</button>
						</div>
					</div>
				</div>
			`;


			// para que el usuario sepa que debe hacer click en la casilla de fecha,
			// cambiamos la forma del cursor a 'pointer'
			elem.css("cursor", "pointer");

			// ahora vamos a setear los dias de la cabecera. Para que éstos se puedan formatear con el filtro 'date'
			// y a su vez sea compatible con las librerías de idiomas locales de angular, los días deben estar en formato
			// date
			// todo en un futuro hay que encapsular esto dentro de una función. No es buena idea tener código por aquí suelto
			scope.diasCabecera = [];

			// escogemos un día cualquiera, eso sí, que sea lunes
			let dia: Date = new Date();
			dia.setMonth(11);
			dia.setFullYear(2003);
			dia.setDate(1);
			dia.setHours(0);
			dia.setMinutes(0);
			dia.setSeconds(0);
			dia.setMilliseconds(0);

			scope.diasCabecera.push(dia);

			// añadimos el resto de días de la semana
			for (let i: number = 0; i < 6; i++) {
				let diaNuevo: Date = new Date(dia.getTime() + 86400000);
				scope.diasCabecera.push(diaNuevo);
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
			let getMeses: Function = () => {

				scope.meses = [];

				let ano: number = scope.puntero.getFullYear();
				let m: number = 0;

				for (let i: number = 0; i < 12; i++) {
					let nuevoMes: Date = new Date();
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
			let getDiaSemana: Function = (dia: number) => {
				return (dia === 0) ? 6 : dia - 1;
			};

			/**
			 * Como el calendario se estructura en una tabla en la que cada fila es una semana que tiene 7 columnas (los días)
			 * Para hacer más fácil el manejo de los bucles en la directiva, haremos un array de semanas, en el que cada elemento
			 * será a su vez un array con los días de esa semana
			 *
			 * Esta función será llamada cada vez que cambiemos de més o de año
			 *
			 * @type {[type]}
			 */
			let getSemanas: Function = () => {

				// vaciamos el array de semanas
				scope.semanas = [];

				// ahora buscamos el primer día y vemos que día de la semana es:
				let diaSemana: number = getDiaSemana(scope.dias[0].getDay());

				// como todas las filas (semanas) empiezan por lunes, (día 0). En caso de que
				// mes actual no comience por lunes, debemos rellenar los días.
				// todo en el futuo pondremos los días del mes anterior en gris
				let sem: number = 0;

				for (let i: number = 0; i < diaSemana; i++) {
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(null);
				}


				// ahora empezamos a recorrer el array de los días para ir añadiendo cada día en su semana
				for (let d: number = 0; d < scope.dias.length; d++) {
					diaSemana = getDiaSemana(scope.dias[d].getDay());

					// si el día de la semana es 0, significa que es lunes, por lo que pasamos a la siguiente semana.
					sem = (diaSemana === 0) ? sem + 1 : sem;
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(scope.dias[d]);
				}


				// lo mismo que hemos hecho antes rellenando los días previos al inicio del mes, lo hacemos ahora
				// para completar los días que queden hasta finalizar el mes en esa semana
				for (let i: number = 6; i > diaSemana; diaSemana++) {
					scope.semanas[sem] = (scope.semanas[sem] === undefined) ? [] : scope.semanas[sem];
					scope.semanas[sem].push(null);
				}
			};


			/**
			 * Funcíón para obtener los días del més actual.
			 * Se almacenan todos en un array "scope.dias", que posteriormente emplearemos en la función
			 * getSemanas() para almacenarlos en los arrays de semanas
			 * @type {[type]}
			 */
			let getDias: Function = () => {
				scope.dias = [];

				let mes: number = scope.puntero.getMonth();

				// definimos el día 1 del més
				let dia: Date = new Date();
				dia.setMonth(mes);
				dia.setDate(1);
				dia.setFullYear(scope.puntero.getFullYear());
				dia = initDate(dia);
				scope.dias.push(dia);

				// para calcular el día siguiente creamos un nuevo día
				// y le sumamos los segundos que hay en 24 horas
				let nuevoDia: Date = new Date(dia.getTime() + 86400000);

				// creamos un bucle que finalizará cuando el mes cambie
				// momento en el que habremos terminado de generar todos los días
				// del més en curso
				while (mes === nuevoDia.getMonth()) {
					scope.dias.push(nuevoDia);
					nuevoDia = new Date(nuevoDia.getTime() + 86400000);
				}

				// llamamos a la función getSemanas para almacenar los días en los arrays de semanas
				getSemanas();
			};

			/**
			 * Método para cambiar el mes en curso
			 * Si el parámetro que pasamos es -1 significa que queremos ir un mes atrás
			 * Si el parámetro que pasamos es 1 significa que queremos ir un mes adelante
			 * Si no es ninguno de esos valores,
			 * @type {[type]}
			 */
			scope.cambiaMes = (tipo: number) => {

				let mes: number = null;
				let dia: number = null;
				let ano: number = null;

				switch (tipo) {
					case -1:
						// mes anterior:
						mes = (scope.puntero.getMonth() === 0) ? 11 : scope.puntero.getMonth() - 1;
						dia = 1;
						ano = (mes === 11) ? scope.puntero.getFullYear() - 1 : scope.puntero.getFullYear();
						break;
					case 1:
						// mes siguiente:
						mes = (scope.puntero.getMonth() === 11) ? 0 : scope.puntero.getMonth() + 1;
						dia = 1;
						ano = (mes === 0) ? scope.puntero.getFullYear() + 1 : scope.puntero.getFullYear();
						break;
					default:
						return;
				}

				// guaramos el día actualizado y calculamos el més
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

				// actualizamos la fecha y calculamos los meses y días para actualizar la vista
				scope.puntero.setFullYear(ano);
				getMeses();
				getDias();
			};

			/**
			 * Método que se dispara en la pérdida de foco del campo de horas y asigna el valor a la variable
			 * del scope
			 * @param $ev
			 */
			scope.setHora = ($ev) => {
				scope.intHora = parseInt($ev.target.value);
				scope.puntero.setHours(scope.intHora);
			};

			/**
			 * Método que se dispara en la pérdida de foco del campo de minutos y asigna el valor a la variable
			 * del scope
			 * @param $ev
			 */
			scope.setMinutes = ($ev: ng.IAngularEvent) => {
				scope.intMinutos = parseInt($ev.target.value, 10);
				scope.puntero.setMinutes(scope.intMinutos);
			};

			/**
			 * Método para calcular el estilo visual de un día. Si el día está seleccionado lo marcamos en verde
			 * @type {[type]}
			 */
			scope.claseDia = (dia: Date) => {
				return (dia !== null && mismoDia(dia, ngModel.$modelValue)) ? "bg-success" : "";
			};


			/**
			 * Función para chequear que el día sea correcto teniendo en cuenta los filtros por los que debe pasar
			 * @type {[type]}
			 */
			let checkDay: Function = (dia: Date) : boolean => {
				if (dia === null) {
					return false;
				}

				// primero comprobamos que el día esté entre el mínimo
				if (min !== null && dia < min) {
					return false;
				}
				// ahora comprobamos que no esté fuera del máximo
				if (max !== null && dia > max) {
					return false;
				}

				// ahora comprobamos que el día esté dentro de los permitidos
				if (Array.isArray(onlyAllowed) && onlyAllowed.indexOf(dia.getTime()) < 0) {
					return false;
				}

				// ahora comprobamos que no esté en los días permitidos
				if (Array.isArray(notAllowed) && notAllowed.indexOf(dia.getTime()) >= 0) {
					return false;
				}

				// ahora comprobamos que esté dentro de los días de la semana permitidos
				if (Array.isArray(onlyDays) && onlyDays.indexOf(dia.getDay()) < 0) {
					return false;
				}

				// ahora comprobamos que no esté dentro de los días de la semana prohibidos
				if (Array.isArray(notDays) && notDays.indexOf(dia.getDay()) >= 0) {
					return false;
				}

				// si llegamos hasta aquí es que todos los test se han superado
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
			scope.estiloDia = (dia: Date) => {
				if (!checkDay(dia)) {
					return {
						"color": "#999999"
					};
				} else {
					return {};
				}
			};


			// definimos el elemento que contendrá el HTML
			let capa: ng.IAugmentedJQuery = null;
			scope.activo = false;

			// establecemos el input a readonly
			elem.attr("readonly", "true");

			// cuando el usuario haga click en el cuadro de texto, renderizaremos el calendario o lo ocultaremos
			elem.on("click", () => {
				if (abierto) {
					// lo ocultamos
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


			scope.mouseover = (ev: ng.IAngularEvent, dia: Date) => {
				if (!checkDay(dia)) {
					return "";
				}
				angular.element(ev.target).addClass("bg-primary");
			};

			scope.mouseout = (ev) => {
				angular.element(ev.target).removeClass("bg-primary");
			};

			let esconder = () => {
				abierto = false;
				angular.element(capa).remove();
				capa = null;
			};

			let getDimensiones: Function = () => {

				let de: any = document.documentElement;
				let box: any = elem[0].getBoundingClientRect();
				let top: number = box.top + window.pageYOffset - de.clientTop;
				let left: number = box.left + window.pageXOffset - de.clientLeft;
				return { top: top, left: left };
			};

			let render: Function = () => {
				if (abierto) {
					return;
				}
				if (scope.puntero === null) {
					scope.puntero = initDate();
					getMeses();
					getDias();
				}
				// obtenemos el alto y ancho del elemento
				let dim: any = getDimensiones();

				// scope.top = elem[0].offsetHeight - 1;
				// scope.left = elem[0].offsetLeft;

				scope.top = dim.top + elem[0].offsetHeight;
				scope.left = dim.left;

				scope.width = elem[0].offsetWidth;

				capa = this.$compile(template)(scope);
				// elem.parent().append(capa);
				angular.element(this.$document[0].body).append(capa);
				abierto = true;
			};

			scope.asignar = (dia) => {

				if (!checkDay(dia)) {
					return;
				}
				scope.puntero = dia;


				if (typeof scope.intHora !== "undefined" && scope.intHora !== null) {
					let hora = parseInt(scope.intHora);
					scope.puntero.setHours(hora);
				}

				if (typeof scope.intMinutos !== "undefined" && scope.intMinutos !== null) {
					let minutos = parseInt(scope.intMinutos);
					scope.puntero.setMinutes(minutos);
				}


				ngModel.$setViewValue(new Date(scope.puntero.getTime()));

				if (scope.hour) {
					// cuando está activada la selección de hora, es necesario confirmar con el botón
					return;
				}

				// aplicar();
				esconder();
			};

			scope.asignarHora = () => {
				if (scope.puntero && scope.puntero.getTime()) {
					ngModel.$setViewValue(new Date(scope.puntero.getTime()));
					esconder();
				} else {
					return;
				}
			};

			scope.borrar = () => {
				ngModel.$setViewValue(null);
				scope.puntero = null;
				esconder();
			};

			scope.$watch("min", (nueva: Date) => {
				min = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("max", (nueva: Date) => {
				max = (nueva === undefined || nueva === null) ? null : nueva;
			});

			scope.$watch("hora", (nueva: boolean) => {
				hora = nueva;
			});

			scope.$watch("onlyAllowed", (nueva: Array<Date>) => {
				let nuevas: Array<number> = [];
				if (Array.isArray(nueva)) {
					for (let i: number = 0; i < nueva.length; i++) {
						nuevas[i] = initDate(nueva[i]).getTime();
					}
					onlyAllowed = nuevas;
				} else {
					onlyAllowed = null;
				}
			});

			scope.$watch("notAllowed", (nueva: Array<Date>) => {
				let nuevas: Array<number> = [];
				if (Array.isArray(nueva)) {
					for (let i: number = 0; i < nueva.length; i++) {
						nuevas[i] = initDate(nueva[i]).getTime();
					}
					notAllowed = nuevas;
				} else {
					notAllowed = null;
				}
			});

			scope.$watch("onlyDays", (nueva: Array<number>) => {
				onlyDays = (Array.isArray(nueva)) ? nueva : null;
			});

			scope.$watch("notDays", (nueva: Array<number>) => {
				notDays = (Array.isArray(nueva)) ? nueva : null;
			});

			scope.$watch("isOpen", (nueva: boolean) => {
				if (nueva === true) {
					render();
				} else {
					esconder();
				}
			});

			scope.$watch("ngModel", (nueva: Date) => {
				let tipo: string = Object.prototype.toString.call(nueva);

				if (tipo === "[object Date]" && nueva !== null) {
					scope.puntero = nueva;
					scope.intHora = nueva.getHours();
					scope.intMinutos = nueva.getMinutes();
				} else {
					scope.puntero = initDate();
				}

				getMeses();
				getDias();
				aplicar();
			});
		};

		constructor (private $compile: ng.ICompileService, private $document: ng.IDocumentService, private $filter: ng.IFilterService) {

		}

		static factory (): ng.IDirectiveFactory {
			const directiva = ($compile:ng.ICompileService, $document:ng.IDocumentService, $filter:ng.IFilterService) => new Directive($compile, $document, $filter);
			directiva.$inject = ["$compile", "$document", "$filter"];
			return directiva;
		}
	}

	angular.module("dcDatePicker").directive("dcDatePicker", Directive.factory());
}
