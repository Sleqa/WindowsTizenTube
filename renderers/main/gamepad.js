/**
 * Traduce la entrada de un mando/controlador (Xbox, PlayStation, etc.) conectado mediante la
 * Gamepad API del navegador a eventos de teclado, que es el mecanismo que espera la interfaz
 * de YouTube TV para la navegación (igual que haría un mando de TV/Android TV real).
 *
 * Mapeo ("standard" gamepad layout):
 *  - D-pad / stick izquierdo -> Flechas de dirección (navegación).
 *  - Botón inferior (X en PlayStation, A en Xbox)  -> Enter (selección).
 *  - Botón derecho (Círculo en PlayStation, B en Xbox) -> Escape (atrás).
 */
(function () {

    if (window.__ytTvGamepadSupport) return;
    window.__ytTvGamepadSupport = true;

    var KEYS = {
        ArrowUp:    { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
        ArrowDown:  { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
        ArrowLeft:  { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
        ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
        Enter:      { key: 'Enter',      code: 'Enter',      keyCode: 13 },
        Back:       { key: 'Escape',     code: 'Escape',     keyCode: 27 }
    };

    // Retardo antes de empezar a repetir una dirección mantenida, y frecuencia de repetición.
    var REPEAT_DELAY = 400;
    var REPEAT_INTERVAL = 150;

    // Zona muerta del stick analógico izquierdo, usado como alternativa al D-pad.
    var STICK_DEADZONE = 0.5;

    // Estado por nombre lógico de tecla: { pressed, timeout, interval }.
    var state = {};

    function dispatchKey(name, type) {

        var def = KEYS[name];
        var target = document.activeElement || document.body;

        var event = new KeyboardEvent(type, {
            key: def.key,
            code: def.code,
            bubbles: true,
            cancelable: true,
            composed: true
        });

        // keyCode/which no pueden establecerse mediante el diccionario del constructor,
        // así que se redefinen manualmente para máxima compatibilidad con listeners antiguos.
        Object.defineProperty(event, 'keyCode', { get: function () { return def.keyCode; } });
        Object.defineProperty(event, 'which', { get: function () { return def.keyCode; } });

        target.dispatchEvent(event);

    }

    /** Inicia la pulsación de una dirección, repitiéndola mientras se mantenga. */
    function beginHold(name) {

        var s = state[name] || (state[name] = {});
        if (s.pressed) return;

        s.pressed = true;
        dispatchKey(name, 'keydown');

        s.timeout = setTimeout(function () {
            s.interval = setInterval(function () {
                dispatchKey(name, 'keydown');
            }, REPEAT_INTERVAL);
        }, REPEAT_DELAY);

    }

    /** Finaliza la pulsación mantenida de una dirección. */
    function endHold(name) {

        var s = state[name];
        if (!s || !s.pressed) return;

        s.pressed = false;
        clearTimeout(s.timeout);
        clearInterval(s.interval);
        dispatchKey(name, 'keyup');

    }

    /** Pulsación simple (sin repetición) para botones de acción. */
    function tap(name, isDown) {

        var s = state[name] || (state[name] = {});

        if (isDown && !s.pressed) {
            s.pressed = true;
            dispatchKey(name, 'keydown');
        } else if (!isDown && s.pressed) {
            s.pressed = false;
            dispatchKey(name, 'keyup');
        }

    }

    function poll() {

        var pads = navigator.getGamepads ? navigator.getGamepads() : [];

        var up = false, down = false, left = false, right = false;
        var confirm = false, back = false;

        for (var i = 0; i < pads.length; i++) {

            var pad = pads[i];
            if (!pad || !pad.connected) continue;

            var buttons = pad.buttons || [];
            var axes = pad.axes || [];

            // D-pad (mapeo "standard": índices 12-15).
            if (buttons[12] && buttons[12].pressed) up = true;
            if (buttons[13] && buttons[13].pressed) down = true;
            if (buttons[14] && buttons[14].pressed) left = true;
            if (buttons[15] && buttons[15].pressed) right = true;

            // Stick analógico izquierdo como alternativa al D-pad.
            if (axes[1] <= -STICK_DEADZONE) up = true;
            if (axes[1] >= STICK_DEADZONE) down = true;
            if (axes[0] <= -STICK_DEADZONE) left = true;
            if (axes[0] >= STICK_DEADZONE) right = true;

            // Botón inferior (X / A) y botón derecho (Círculo / B).
            if (buttons[0] && buttons[0].pressed) confirm = true;
            if (buttons[1] && buttons[1].pressed) back = true;

        }

        up ? beginHold('ArrowUp') : endHold('ArrowUp');
        down ? beginHold('ArrowDown') : endHold('ArrowDown');
        left ? beginHold('ArrowLeft') : endHold('ArrowLeft');
        right ? beginHold('ArrowRight') : endHold('ArrowRight');

        tap('Enter', confirm);
        tap('Back', back);

        window.requestAnimationFrame(poll);

    }

    window.addEventListener('gamepadconnected', function (e) {
        console.log('Gamepad conectado:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', function (e) {
        console.log('Gamepad desconectado:', e.gamepad.id);
    });

    window.requestAnimationFrame(poll);

})();
