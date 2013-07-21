/**
 * Redundant JSON I/O
 *
 * RJSON may contain the same key several times over. Upon parsing,
 * the last value (which is also the latest) will be used.
 */
/*global dessert, troop, lightstore */
/*jshint node:true */
troop.postpone(lightstore, 'Rjson', function () {
    'use strict';

    var fs = require('fs');

    /**
     * @name lightstore.Rjson.create
     * @function
     * @param {string} fileName Name of database file.
     * @returns {lightstore.Rjson}
     */

    /**
     * @class
     * @extends troop.Base
     */
    lightstore.Rjson = troop.Base.extend()
        .addPrivateMethods(/** @lends lightstore.Rjson# */{
            /**
             * Called when data is read from disk.
             * @param {function} handler
             * @param {object} err
             * @param {object} data
             * @private
             */
            _onData: function (handler, err, data) {
                var parsed;

                if (!err) {
                    try {
                        parsed = JSON.parse('{' + data.toString().slice(0, -1) + '}');
                    } catch (e) {
                        err = new Error("Corrupted database contents.");
                    }
                }

                handler.call(this, err, parsed);
            },

            /**
             * Called when data is loaded and is ready to be compacted.
             * Saves data back to disk immediately on success,
             * calls handler (if any) immediately on error.
             * @param {function} handler
             * @param {object} err
             * @param {object} data
             * @private
             */
            _onCompact: function (handler, err, data) {
                if (err) {
                    if (typeof handler === 'function') {
                        handler.call(this, err);
                    }
                } else {
                    fs.writeFile(
                        this.fileName,
                        JSON.stringify(data).slice(1, -1) + ',',
                        typeof handler === 'function' ?
                            handler.bind(this) :
                            undefined
                    );
                }
            }
        })
        .addMethods(/** @lends lightstore.Rjson# */{
            /**
             * Initializes RJSON.
             * @param {string} fileName Name of database file.
             */
            init: function (fileName) {
                /**
                 * @constant
                 * @type {string}
                 */
                this.fileName = fileName;
            },

            /**
             * Reads the whole RJSON database file.
             * @param {function} handler Callback
             * @returns {lightstore.Rjson}
             */
            read: function (handler) {
                dessert.isFunction(handler, "Invalid read handler");

                fs.readFile(
                    this.fileName,
                    this._onData.bind(this, handler)
                );

                return this;
            },

            /**
             * Compacts database files.
             * @param {function} [handler] Callback
             * @returns {lightstore.Rjson}
             */
            compact: function (handler) {
                dessert.isFunctionOptional(handler, "Invalid compaction handler");

                this.read(this._onCompact.bind(this, handler));

                return this;
            },

            /**
             * Writes object to database.
             * @param {object} data
             * @param {function} [handler] Callback
             * @returns {lightstore.Rjson}
             */
            write: function (data, handler) {
                dessert
                    .isObject(data, "Invalid write data buffer")
                    .isFunctionOptional(handler, "Invalid write handler");

                fs.appendFile(
                    this.fileName,
                    JSON.stringify(data).slice(1, -1) + ',',
                    typeof handler === 'function' ?
                        handler.bind(this) :
                        undefined
                );

                return this;
            }
        });
});
