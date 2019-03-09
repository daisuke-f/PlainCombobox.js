'use strict';

(function(global) {

	/**
	 * Create a combobox.
	 * 
	 * @constructor
	 * @param {HTMLInputElement} element a textbox to become combobox.
	 * @param {*} data a object or string array to be used in listbox.
	 * @param {*} options 
	 */
	function MyCombo(element, data, options) {
		if(!(element.tagName == 'INPUT' && element.type.toUpperCase() == 'TEXT')) {
			throw new Error('element must be <input type="text">.');
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
				throw new Error('data must has 1 or more properties');
			}
		}

		this.element = element;
		this.data = data;

		// default option values
		this.options = {
			autoPosition : true,
			buttonLabel : '\u25bc',
			classPrefix : 'MyCombo_',
			itemLabelGenerator : function(value, name) { return value + ": " + name; },
			listSize : 10
		};

		if(options) {
			for(var prop in options) {
				this.options[prop] = options[prop];
			}
		}

		this.button = null;
		this.list = null;
		this.isListVisible = false;

		// used to prevent listbox from raising blur event while it is opening.
		this.isListboxOpening = false;

		this.init();
	}

	MyCombo.prototype.onfocusout = function(evt) {
		// console.debug('onblur');
		if(evt.target == this.list && !this.isListboxOpening) {
			this.closeList();
		} else if(evt.target == this.element && !this.isListboxOpening) {
			this.closeList();
		}
	};

	MyCombo.prototype.onkeydown = function(evt) {
		// console.debug('onkeydown');
		if(evt.target == this.element || evt.target == this.list) {
			if(evt.key == 'Escape') {
				this.closeList();
				this.element.focus();
			}
		} if(evt.target == this.list) {
			if(evt.key == 'Enter' || evt.key == ' ') {
				this.closeList(evt.target.value);
				this.element.focus();
			} else if(evt.key == 'Tab') {
				evt.preventDefault();
				this.closeList();
				this.element.focus();
			} else if(evt.key == 'ArrowUp' && this.list.firstChild.selected) {
				evt.preventDefault();
				this.closeList();
				this.element.focus();
			} else if(evt.key == 'ArrowDown' && this.list.lastChild.selected) {
				evt.preventDefault();
				this.closeList();
				this.element.focus();
			}
		} if(evt.target == this.element) {
			if(evt.key == 'ArrowUp') {
				this.isListboxOpening = true;
				this.openList()
				this.list.lastChild.selected = true;
				this.list.focus();
			} else if(evt.key == 'ArrowDown') {
				this.isListboxOpening = true;
				this.openList();
				this.list.firstChild.selected = true;
				this.list.focus();
			}
		}
	};

	MyCombo.prototype.onkeyup = function(evt) {
		if(evt.target == this.list) {
			if(evt.key == 'ArrowUp' || evt.key == 'ArrowDown')
				this.isListboxOpening = false;
		}
	};

	MyCombo.prototype.onmousedown = function(evt) {
		if(evt.target == this.button) this.isListboxOpening = true;
	};

	MyCombo.prototype.onmouseup = function(evt) {
		if(evt.target == this.button) this.isListboxOpening = false;
	}

	MyCombo.prototype.onclick = function(evt) {
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
		}
	};

	MyCombo.prototype.oninput = function(evt) {
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
	MyCombo.prototype.autoPosition = function() {
		var ref = window.getComputedStyle(this.element);
		var btn = window.getComputedStyle(this.button);

		var d = 0;
		var prop = [ 'borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom' ];
		prop.forEach(function(val) {
			d += Number.parseFloat(ref[val]) - Number.parseFloat(btn[val]);
		}.bind(this));

		this.button.style.boxSizing = 'content-box';
		this.button.style.height = (Number.parseFloat(ref.height) + d) + 'px';
		this.button.style.fontSize = ref.fontSize;
		this.button.style.marginLeft = -1 * Number.parseFloat(ref.marginRight) + 'px';

		this.list.style.fontSize = ref.fontSize;
		this.list.style.maxWidth = ref.width;
		this.list.style.marginLeft = ref.marginLeft;
		this.list.style.marginTop = -1 * Number.parseFloat(ref.marginBottom) + 'px';
	};

	/**
	 * Display listbox.
	 */
	MyCombo.prototype.openList = function() {
		this.list.value = this.element.value;
		this.list.style.display = 'block';
		this.isListVisible = true;
	};

	/**
	 * Hide listbox.
	 * 
	 * @param {string} value if specified, update textbox value with this value.
	 */
	MyCombo.prototype.closeList = function(value) {
		if(value !== undefined) this.element.value = value;
		this.list.style.display = 'none';
		this.isListVisible = false;
	};

	/**
	 * Remove all additional components and restore textbox.
	 */
	MyCombo.prototype.dispose = function() {
		this.button.parentNode.removeChild(this.button);
		this.list.parentNode.removeChild(this.list);

		// Todo: make this work correctly.
		this.element.removeEventListener('input', this.oninput.bind(this));
		this.element.removeEventListener('focusout', this.onfocusout.bind(this));
		this.element.removeEventListener('keydown', this.onkeydown.bind(this));
		this.element.removeEventListener('keyup', this.onkeyup.bind(this));

		this.element = null;
		this.button = null;
		this.list = null;
		this.data = null;
	};

	/**
	 * Initialize UI Components.
	 */
	MyCombo.prototype.init = function() {
		this.button = document.createElement('button');
		this.button.appendChild(document.createTextNode(this.options.buttonLabel));
		this.button.classList.add(this.options.classPrefix + 'button');

		this.list = document.createElement('select');
		this.list.style.position = 'absolute';
		this.list.classList.add(this.options.classPrefix + 'list');
		this.list.size = this.options.listSize;

		Object.keys(this.data).sort().forEach(function(val) {
			var item = document.createElement('option');
			var itemLabel = this.options.itemLabelGenerator.apply(null, [ val, this.data[val] ]);
			item.classList.add(this.options.classPrefix + 'item');
			item.appendChild(document.createTextNode(itemLabel));
			item.value = val;
			this.list.appendChild(item);
		}.bind(this));

		var nextSibling = this.element.nextSibling;

		this.element.parentNode.insertBefore(this.button, nextSibling);
		this.element.parentNode.insertBefore(this.list, nextSibling);

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

   global.MyCombo = MyCombo; 
})(window);