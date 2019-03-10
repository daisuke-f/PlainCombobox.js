'use strict';

/**
 * Convert existing textbox into combobox without any external libraries.
 * 
 * @constructor
 * @param {HTMLInputElement} element a textbox to become combobox.
 * @param {*} data a object or string array to be used in listbox.
 * @param {*} options optionally overwrites default behavior. see DEFAULT_OPTIONS property.
 */
function PlainCombobox(element, data, options) {
	if(!(element.tagName == 'INPUT' && 0<=['TEXT', 'SEARCH'].indexOf(element.type.toUpperCase()))) {
		throw new Error('element must be <input type="text"> or <input type="search">.');
	}
	if(data == null) {
		throw new Error('data must be object or string array.');
	}
	if(data instanceof Array) {
		if(!(0<data.length)) {
			throw new Error('data must not be empty array.');
		}
	} else {
		if(!(0<Object.keys(data).length)) {
			throw new Error('data must has at least 1 property.');
		}
	}

	/** textbox. */
	this.element = element;

	/** data shown inside listbox. */
	this.data = data;

	this.options = Object.create(this.constructor.DEFAULT_OPTIONS);

	// parameter overwrites default options.
	if(options) {
		for(var prop in options) {
			this.options[prop] = options[prop];
		}
	}

	/** <span> added next to textbox and contains button and list. */
	this.assets = null;

	/** <button> to open/close listbox. */
	this.button = null;

	/** <select> to select values and update textbox with it. */
	this.list = null;

	/** status of listbox. */
	this.isListVisible = false;

	/** used to prevent listbox from raising blur event while it is opening. */
	this.isListboxOpening = false;

	/** backup original style value of textbox for restoring. */
	this.styleBackup = {};

	this.init();
}

PlainCombobox.prototype.onfocusout = function(evt) {
	// console.debug('onblur');
	if(evt.target == this.list && !this.isListboxOpening) {
		this.closeList();
	} else if(evt.target == this.element && !this.isListboxOpening) {
		this.closeList();
	}
};

/** key name list used to remove gaps between IE11 and standards. */
PlainCombobox.KEYS = {
	ESC : [ 'Escape', 'Esc' ],
	UP : [ 'ArrowUp', 'Up' ],
	DOWN : [ 'ArrowDown', 'Down' ]
};

/**
 * check if keyboard event was raised by specified key.
 * 
 * @param {KeyboardEvent} evt DOM KeyboardEvent object.
 * @param {*} expectedKey property name of key name list or actual key name, or array of them.
 */
PlainCombobox.prototype.testKey = function(evt, expectedKey) {
	var actualKey = evt.key;
	if(expectedKey instanceof Array) {
		for(var i=0; i<expectedKey.length; i++) {
			if(this.testKey(evt, expectedKey[i]))
				return true;
		}
	} else {
		if(this.constructor.KEYS[expectedKey]) {
			return 0<=this.constructor.KEYS[expectedKey].indexOf(actualKey);
		} else {
			return expectedKey===actualKey;
		}
	}
	return false;
};

PlainCombobox.prototype.onkeydown = function(evt) {
	// console.debug('onkeydown');

	if(evt.target == this.element || evt.target == this.list) {
		if(this.testKey(evt, "ESC")) {
			this.closeList();
			this.element.focus();
		}
	} if(evt.target == this.list) {
		if(this.testKey(evt, ['Enter', ' '])) {
			evt.preventDefault();
			this.closeList(evt.target.value);
			this.element.focus();
		} else if(this.testKey(evt, 'Tab')) {
			evt.preventDefault();
			this.closeList();
			this.element.focus();
		} else if(this.testKey(evt, 'UP') && this.list.firstChild.selected) {
			evt.preventDefault();
			this.closeList();
			this.element.focus();
		} else if(this.testKey(evt, 'DOWN') && this.list.lastChild.selected) {
			evt.preventDefault();
			this.closeList();
			this.element.focus();
		}
	} if(evt.target == this.element) {
		if(this.testKey(evt, 'UP')) {
			evt.preventDefault();
			this.isListboxOpening = true;
			this.openList()
			this.list.lastChild.selected = true;
			this.list.focus();
		} else if(this.testKey(evt, 'DOWN')) {
			evt.preventDefault();
			this.isListboxOpening = true;
			this.openList();
			this.list.firstChild.selected = true;
			this.list.focus();
		}
	}
};

PlainCombobox.prototype.onkeyup = function(evt) {
	if(evt.target == this.list) {
		if(this.testKey(evt, ['UP', 'DOWN']))
			this.isListboxOpening = false;
	}
};

PlainCombobox.prototype.onmousedown = function(evt) {
	if(evt.target == this.button) this.isListboxOpening = true;
};

PlainCombobox.prototype.onmouseup = function(evt) {
	if(evt.target == this.button) this.isListboxOpening = false;
}

PlainCombobox.prototype.onclick = function(evt) {
	// console.debug('onclick');
	if(evt.target == this.button) {
		if(this.isListVisible) {
			this.closeList();
		} else {
			this.openList();
			this.list.focus();
		}
	} else if(evt.target.parentNode == this.list) {
		this.closeList(evt.target.getAttribute('value'));
		this.element.focus();
	} else if(evt.target == this.list) {
		this.closeList(evt.target.value);
		this.element.focus();
	}
};

PlainCombobox.prototype.oninput = function(evt) {
	if(!this.isListVisible) {
		this.openList();
	}
	for(var i=0; i<this.list.childNodes.length; i++) {
		if(evt.target.value <= this.list.childNodes.item(i).value) {
			this.list.childNodes.item(i).selected = true;
			break;
		}
	}
};

/**
 * Set apropriate space between textbox and button/list.
 */
PlainCombobox.prototype.autoPosition = function() {
	this.button.style.boxSizing = 'content-box';

	var ref = window.getComputedStyle(this.element);
	var btn = window.getComputedStyle(this.button);

	/** button width include padding and border. */
	var w = 0;

	/** height gap between textbox and button. */
	var d = 0;
	var prop = [ 'borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom' ];
	prop.forEach(function(val) {
		d += parseFloat(ref[val]) - parseFloat(btn[val]);
	});

	this.button.style.fontSize = ref.fontSize;

	if(this.options.buttonInside) {
		// calculate button width.
		var prop2 = [ 'borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight', 'width' ];
		prop2.forEach(function(val) {
			w += parseFloat(btn[val]);
		});

		// backup inline style.
		this.styleBackup.paddingRight = this.element.style.paddingRight;
		this.styleBackup.width = this.element.style.width;

		// add space for button inside textbox.
		this.element.style.paddingRight = (parseFloat(ref.paddingRight) +
			w - parseFloat(ref.borderRightWidth)) + 'px';
		
		this.element.style.width = (parseFloat(ref.width) -
			w + parseFloat(ref.borderRightWidth)) + 'px';
	}

	this.button.style.height = (parseFloat(ref.height) + d) + 'px';
	this.button.style.marginLeft = -1 * (w + parseFloat(ref.marginRight)) + 'px';

	this.list.style.fontSize = ref.fontSize;
	this.list.style.width = ref.width;
	this.list.style.marginLeft = ref.marginLeft;
	this.list.style.marginTop = -1 * parseFloat(ref.marginBottom) + 'px';
};

/**
 * Display listbox.
 */
PlainCombobox.prototype.openList = function() {
	this.list.value = this.element.value;
	this.list.style.display = 'block';
	this.isListVisible = true;
};

/**
 * Hide listbox.
 * 
 * @param {string} value if specified, update textbox value with this value.
 */
PlainCombobox.prototype.closeList = function(value) {
	if(value !== undefined) this.element.value = value;
	this.list.style.display = 'none';
	this.isListVisible = false;
};

/**
 * Remove all additionally created objects from textbox and restore it.
 */
PlainCombobox.prototype.dispose = function() {
	// remove ui components.
	this.assets.parentNode.removeChild(this.assets);

	// remove event handler from textbox.
	// Todo: currently this does not work.
	this.element.removeEventListener('input', this.oninput.bind(this));
	this.element.removeEventListener('focusout', this.onfocusout.bind(this));
	this.element.removeEventListener('keydown', this.onkeydown.bind(this));
	this.element.removeEventListener('keyup', this.onkeyup.bind(this));

	// restore original inline style of textbox.
	for(var prop in this.styleBackup) {
		this.element.style[prop] = this.styleBackup[prop];
	}

	this.element = null;
	this.assets = null;
	this.button = null;
	this.list = null;
	this.data = null;
};

/**
 * Initialize UI Components.
 */
PlainCombobox.prototype.init = function() {
	this.assets = document.createElement('span');
	this.assets.classList.add(this.options.classPrefix + 'assets');

	this.button = document.createElement('button');
	this.button.appendChild(document.createTextNode(this.options.buttonLabel));
	this.button.classList.add(this.options.classPrefix + 'button');

	this.list = document.createElement('select');
	this.list.style.position = 'absolute';
	this.list.classList.add(this.options.classPrefix + 'list');
	this.list.size = this.options.listSize;

	var keys = this.data instanceof Array ? this.data : Object.keys(this.data);
	keys.sort().forEach(function(val) {
		var item = document.createElement('option');
		var itemLabel = this.data instanceof Array ? val :
			this.options.itemLabelGenerator.apply(null, [ val, this.data[val] ]);
		item.classList.add(this.options.classPrefix + 'item');
		item.appendChild(document.createTextNode(itemLabel));
		item.value = val;
		this.list.appendChild(item);
	}.bind(this));

	this.assets.appendChild(this.button);
	this.assets.appendChild(this.list);

	this.element.parentNode.insertBefore(this.assets, this.element.nextSibling);

	if(this.options.autoPosition) {
		this.autoPosition();
	}

	this.element.addEventListener('input', this.oninput.bind(this));
	this.element.addEventListener('focusout', this.onfocusout.bind(this));
	this.element.addEventListener('keydown', this.onkeydown.bind(this));
	this.element.addEventListener('keyup', this.onkeyup.bind(this));

	this.button.addEventListener('mousedown', this.onmousedown.bind(this));
	this.button.addEventListener('mouseup', this.onmouseup.bind(this));
	this.button.addEventListener('click', this.onclick.bind(this));

	this.list.addEventListener('focusout', this.onfocusout.bind(this));
	this.list.addEventListener('keydown', this.onkeydown.bind(this));
	this.list.addEventListener('keyup', this.onkeyup.bind(this));
	this.list.addEventListener('click', this.onclick.bind(this));

	this.closeList();
};

PlainCombobox.DEFAULT_OPTIONS = {
	autoPosition : true,
	buttonInside : true,
	buttonLabel : '\u25bc',
	classPrefix : 'PlainCombobox_',
	itemLabelGenerator : function(value, name) { return value + ": " + name; },
	listSize : 10
};