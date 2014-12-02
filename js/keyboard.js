(function () {
    'use strict';

    function Keyboard(options) {
        return {
            OPTIONS: {
                inputContainer: null,
                boardContainer: null,
                layout: null
            },
            init: function () {
                var that = this;

                this.options = $.extend({}, this.OPTIONS, options);
                this.board = this.generateBoard(this.options.layout || this.basicLayout);
                this.currentInput = this.generateInput(this.options.inputContainer);
                this.currentCursorPosition = 0;
                this.currentInput.focus();

                this.currentInput.on('focus, click', function () {
                    var $input = that.currentInput = $(this);

                    that.currentCursorPosition = $input.getCursorPosition();
                    that.currentSelection = $input.getSelection();
                });

                this.currentInput[0].onkeydown = function (e) {
                    var text = String.fromCharCode(e.keyCode),
                        pattern = /^[ A-Za-z0-9_@.\/#&+\-]*$/,
                        flag = pattern.test(text);

                    if (e.which === 8) {
                        e.preventDefault();
                        that.del()();
                    } else if (flag) {
                        e.preventDefault();
                        that.write(text)();
                    }
                };
            },
            /**
             * Create the keyboard DOM.
             * The layout parameter is an object which 
             * contains character sets, each containing
             * rows of keys which are displayed together.
             */
            generateBoard: function (layout) {
                var that = this,
                    characterSet,
                    $charSetContainer,
                    $boardContainer = this.options.boardContainer,
                    $board = $('<div>', {'class': 'board'});

                for (characterSet in layout) {
                    if (layout.hasOwnProperty(characterSet)) {
                        $charSetContainer = $('<div>', {'class':  'character-set ' + characterSet });

                        $.each(layout[characterSet], function createRow(rowName, keys) {
                            var $row = $('<div>', {'class': 'flex-row'}),
                                i = 0,
                                $button;

                            for (i; i < keys.length; i += 1) {
                                $button = that.generateButton(keys[i]);

                                $row.append($button);
                            }

                            $charSetContainer.append($row);
                        });

                        $board.append($charSetContainer);
                    }
                }

                return $boardContainer.append($board);
            },
            /**
             * Create the key DOM.
             * keyData is an object whose 'value' property
             * is the string which becomes the button label. 
             * keyData has optional properties:
             * 'buttonClass' for a custom CSS selector, and 
             * 'onclick' for custom event handling. The value
             * for 'onclick' in keyData should be a string
             * which matches the name of a Keyboard method.
             */
            generateButton: function (keyData) {
                var text = keyData.value,
                    $key = $('<div>', { 'class': 'key', html: text }),
                    $button = $('<div>', { 'class': 'button' }),
                    buttonClass = keyData.buttonClass,
                    onclick = keyData.onclick ? this[keyData.onclick]() : this.write($key.text());

                if (buttonClass) { $button.addClass(buttonClass); }
                $button.on('click', onclick).append($key);

                return $button;
            },
            generateInput: function (container) {
                var that = this,
                    $input = $('<input>', {
                        'name': 'test_input',
                        'type': 'text',
                        'placeholder': 'Type something...',
                        'max-length': 80
                    }),
                    $btnClear = $('<i>', {'class': 'icon-clear'});

                $btnClear.on('click', function () {
                    $input.val("").focus();
                    that.currentCursorPosition = 0;
                });

                container.append($input);
                container.append($btnClear);

                return $input;
            },
            write: function (character) {
                var that = this;

                return function () {
                    var text = that.currentInput.val(),
                        position = that.currentCursorPosition,
                        selection = that.currentSelection,
                        output = (function () {
                            if (selection) {
                                var tail = text.slice(text.indexOf(selection) + selection.length);
                                return [text.slice(0, text.indexOf(selection)), character, tail].join('');
                            }
                            return [text.slice(0, position), character, text.slice(position)].join('');
                        }());

                    that.currentInput.val(output).focus();
                    that.currentCursorPosition += 1;
                    that.currentInput.setSelection(that.currentCursorPosition);
                    that.currentSelection = null;
                };
            },
            del: function () {
                var that = this;

                return function () {
                    var text = that.currentInput.val(),
                        position = that.currentCursorPosition,
                        selection = that.currentSelection,
                        output = (function () {
                            if (selection) {
                                var tail = text.slice(text.indexOf(selection) + selection.length);
                                return [text.slice(0, text.indexOf(selection)), tail].join('');
                            }
                            return [text.slice(0, position - 1), text.slice(position)].join('');
                        }());

                    that.currentInput.val(output).focus();
                    if (!selection) { that.currentCursorPosition -= 1; }
                    if (that.currentCursorPosition < 0) { that.currentCursorPosition = 0; }
                    that.currentInput.setSelection(that.currentCursorPosition);
                    that.currentSelection = null;
                };
            },
            submit: function () {
                var that = this;

                return function () {
                    that.currentInput.trigger('submit');
                    that.currentSelection = null;
                };
            },
            toggleCaps: function () {
                var that = this;

                return function () {
                    var $caps = $(this),
                        $keys = $('.key'),
                        pattern = /^[A-z]+$/,
                        character,
                        flag;

                    $keys.each(function (index, element) {
                        var $button = $(element).parent('.button');

                        if ($caps.hasClass('off')) {
                            character = element.innerHTML.toUpperCase();
                        } else {
                            character = element.innerHTML.toLowerCase();
                        }

                        flag = pattern.test(character);

                        if (flag) {
                            element.innerHTML = character;
                            $button.off('click');
                            $button.on('click', that.write(character));
                        }
                    });

                    $caps.toggleClass('off');
                    if ($caps.hasClass('off')) {
                        $caps.html("<i class='icon-caps-off'></i>");
                    } else {
                        $caps.html("<i class='icon-caps'></i>");
                    }

                    that.currentSelection = null;
                };
            },
            cursorLeft: function () {
                var that = this;

                return function () {
                    that.currentCursorPosition -= 1;
                    if (that.currentCursorPosition < 0) { that.currentCursorPosition = 0; }

                    that.currentInput.focus();
                    that.currentInput.setSelection(that.currentCursorPosition);
                    that.currentSelection = null;
                };
            },
            cursorRight: function () {
                var that = this;

                return function () {
                    that.currentCursorPosition += 1;
                    if (that.currentCursorPosition > that.currentInput.val().length) {
                        that.currentCursorPosition = that.currentInput.val().length;
                    }

                    that.currentInput.focus();
                    that.currentInput.setSelection(that.currentCursorPosition);
                    that.currentSelection = null;
                };
            },
            basicLayout: {
                uppercase: {
                    row1: [{ value: "Q" }, { value: "W" }, { value: "E" }, { value: "R" }, { value: "T" }, { value: "Y" }, { value: "U" }, { value: "I" }, { value: "O" }, { value: "P" }, { value: "<i class='icon-delete'></i>", buttonClass: 'delete', onclick: 'del' }],
                    row2: [{ value: "A" }, { value: "S" }, { value: "D" }, { value: "F" }, { value: "G" }, { value: "H" }, { value: "J" }, { value: "K" }, { value: "L" }, { value: "\"" }, { value: "GO", buttonClass: 'go', onclick: 'submit' }],
                    row3: [{ value: "<i class='icon-caps'></i>", buttonClass: "caps", onclick: "toggleCaps" }, { value: "Z" }, { value: "X" }, { value: "C" }, { value: "V" }, { value: "B" }, { value: "N" }, { value: "M" }, { value: "," }, { value: "."}, { value: "\'" }, { value: "+" }],
                    row4: [{ value: "", buttonClass: "blank" }, { value: "&nbsp;", buttonClass: 'spacebar' }, { value: "!" }, { value: "?" }, { value: "-" }]
                },
                // lowercase: {
                //     row1: [{ value: "q" }, { value: "w" }, { value: "e" }, { value: "r" }, { value: "t" }, { value: "y" }, { value: "u" }, { value: "i" }, { value: "o" }, { value: "p" }, { value: "Delete", buttonClass: 'del', onclick: 'del' }],
                //     row2: [{ value: "a" }, { value: "s" }, { value: "d" }, { value: "f" }, { value: "g" }, { value: "h" }, { value: "j" }, { value: "k" }, { value: "l" }],
                //     row3: [{ value: "z" }, { value: "x" }, { value: "c" }, { value: "v" }, { value: "b" }, { value: "n" }, { value: "m" }]
                // },
                numeric: {
                    row1: [{ value: "7" }, { value: "8" }, { value: "9" }],
                    row2: [{ value: "4" }, { value: "5" }, { value: "6" }],
                    row3: [{ value: "1" }, { value: "2" }, { value: "3" }],
                    row4: [{ value: "<i class='icon-cursor-left'></i>", buttonClass: "cursor-left", onclick: "cursorLeft" }, { value: "0" }, { value: "<i class='icon-cursor-right'></i>", buttonClass: "cursor-right", onclick: "cursorRight" }]
                }
            }
        };
    }

    jQuery.fn.getCursorPosition = function () {
        var input = this[0],
            position;

        if (typeof input.selectionStart === 'number') {
            position = input.selectionStart;
        }

        return position;
    };

    jQuery.fn.getSelection = function () {
        var input = this[0],
            text;

        if (window.getSelection
                && typeof input.selectionStart === 'number'
                && typeof input.selectionEnd === 'number') {
            text = input.value.substring(input.selectionStart, input.selectionEnd);
        }

        return text;
    };

    jQuery.fn.setSelection = function () {
        var input = this[0],
            start = arguments[0],
            end = arguments[1];

        if (!end) { end = start; }
        input.setSelectionRange(start, end);
    };

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Keyboard;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Keyboard;
    } else {
        window.Keyboard = Keyboard;
    }

}());