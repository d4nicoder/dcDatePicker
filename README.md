##dcDatePicker

dcDatePicker is a simple angular directive to show a calendar whe click in an input element.
You can choose two different views; 'month' and 'day'

###Install instructions
####Bower
```
bower install dcDatepicker
```

###Usage
Tu use the directive, inject the module in your angular app

```html
<script src="path/to/datepicker.js" type="application/javascript">
```

```javascript
angular.module("myApp",["dcDatepicker"]);
```

Then use in an input element
```html
<input type="text" ng-model="myVar" dc-date-picker date-type="day">
```

It's all!!!!

![Day preview](https://raw.github.com/danitetus/dcDatepicker/master/screenshots/dia.png "Day view")

![Month preview](https://raw.github.com/danitetus/dcDatepicker/master/screenshots/mes.png "Month view")
