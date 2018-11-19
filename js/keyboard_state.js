/**
 * \brief  Модуль клавиатуры для игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   04.04.2017
 */

var KEYS = {};


KEYS.KeyboardState = function() {
    // to store the current state
    this.key_codes = {};
    this.modifiers = {};
    
    // create callback to bind/unbind keyboard events
    var _self = this;
    this._onKeyDown = function(event_) { 
        _self._onKeyChange(event_, true); 
    };
    this._onKeyUp = function(event_) { 
        _self._onKeyChange(event_, false);
    };

    // bind keyEvents
    document.addEventListener("keydown", this._onKeyDown, false);
    document.addEventListener("keyup", this._onKeyUp, false);
};


/**
 * \brief Удалить обработку клавиш.
 */
KEYS.KeyboardState.prototype.destroy = function() {
    // unbind keyEvents
    document.removeEventListener("keydown", this._onKeyDown, false);
    document.removeEventListener("keyup", this._onKeyUp, false);
};


KEYS.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
KEYS.KeyboardState.ALIAS = {
    'left'     : 37,
    'up'       : 38,
    'right'    : 39,
    'down'     : 40,
    'space'    : 32,
    'pageup'   : 33,
    'pagedown' : 34,
    'tab'      : 9
};


/**
 * \brief Метод вызываемый по события нажатия клавиши в dom эелементе.
 */
KEYS.KeyboardState.prototype._onKeyChange = function(event_, pressed_) {
    //console.log("onKeyChange", event, pressed, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
    var key_code = event_.keyCode;
    this.key_сodes[key_code] = pressed_;
    this.modifiers['shift'] = event_.shiftKey;
    this.modifiers['ctrl']  = event_.ctrlKey;
    this.modifiers['alt']   = event_.altKey;
    this.modifiers['meta']  = event_.metaKey;
};


/**
 * \brief Метод определяет какая клавиша была нажата.
 * \param {String} Описане клавишы.
 * \returns {Boolean} true если клавиша нажата, false в противном случае.
 */
KEYS.KeyboardState.prototype.pressed  = function(key_desc_) {
    var keys = key_desc_.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var pressed;
        if (KEYS.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
            pressed = this.modifiers[key];
        } else if( Object.keys(KEYS.KeyboardState.ALIAS).indexOf(key) != -1) {
            pressed = this.key_codes[KEYS.KeyboardState.ALIAS[key]];
        } else {
            pressed = this.key_codes[key.toUpperCase().charCodeAt(0)];
        }
        if (!pressed) {
            return false;
        }
    };
    return true;
};
