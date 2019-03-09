'use strict';

(function(global) {

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
			buttonLabel : 'X',
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

		// used to prevent blur event from rising up when button is clicking.
		this.isButtonPressing = false;

		this.init();
	}

	MyCombo.prototype.onfocusout = function(evt) {
		// console.debug('onblur');
		if(evt.target == this.list && !this.isButtonPressing) {
			this.closeList();
		} else if(evt.target == this.element && !this.isButtonPressing) {
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
				this.isButtonPressing = true;
				this.openList()
				this.list.lastChild.selected = true;
				this.list.focus();
			} else if(evt.key == 'ArrowDown') {
				this.isButtonPressing = true;
				this.openList();
				this.list.firstChild.selected = true;
				this.list.focus();
			}
		}
	};

	MyCombo.prototype.onkeyup = function(evt) {
		if(evt.target == this.list) {
			if(evt.key == 'ArrowUp' || evt.key == 'ArrowDown')
				this.isButtonPressing = false;
		}
	};

	MyCombo.prototype.openList = function(value) {
		this.list.value = this.element.value;
		this.list.style.display = 'block';
		this.isListVisible = true;
	};

	MyCombo.prototype.closeList = function(value) {
		if(value !== undefined) this.element.value = value;
		this.list.style.display = 'none';
		this.isListVisible = false;
	};

	MyCombo.prototype.button_onmousedown = function(evt) {
		if(evt.target == this.button) this.isButtonPressing = true;
	};

	MyCombo.prototype.button_onmouseup = function(evt) {
		if(evt.target == this.button) this.isButtonPressing = false;
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
		} else if(evt.target.classList.contains('combo_list_item')) {
			this.closeList(evt.target.getAttribute('value'));
			this.element.focus();
		}
	};

	MyCombo.prototype.input_oninput = function(evt) {
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

	MyCombo.prototype.init = function() {
		this.button = document.createElement('button');
		this.button.appendChild(document.createTextNode(this.options.buttonLabel));

		this.list = document.createElement('select');
		this.list.classList.add('combo_list');
		this.list.size = this.options.listSize;

		Object.keys(this.data).sort().forEach(function(val) {
			var item = document.createElement('option');
			var itemLabel = this.options.itemLabelGenerator.apply(null, [ val, this.data[val] ]);
			item.classList.add('combo_list_item');
			item.appendChild(document.createTextNode(itemLabel));
			item.value = val;
			this.list.appendChild(item);
		}.bind(this));

		var nextSibling = this.element.nextSibling;

		this.element.parentNode.insertBefore(this.button, nextSibling);
		this.element.parentNode.insertBefore(this.list, nextSibling);

		this.element.addEventListener('input', this.input_oninput.bind(this));
		this.element.addEventListener('focusout', this.onfocusout.bind(this));
		this.element.addEventListener('keydown', this.onkeydown.bind(this));
		this.element.addEventListener('keyup', this.onkeyup.bind(this));

		this.button.addEventListener('mousedown', this.button_onmousedown.bind(this));
		this.button.addEventListener('mouseup', this.button_onmouseup.bind(this));
		this.button.addEventListener('click', this.onclick.bind(this));

		this.list.addEventListener('focusout', this.onfocusout.bind(this));
		this.list.addEventListener('keydown', this.onkeydown.bind(this));
		this.list.addEventListener('keyup', this.onkeyup.bind(this));
		this.list.addEventListener('click', this.onclick.bind(this));

		this.closeList();
	};

   global.MyCombo = MyCombo; 
})(window);