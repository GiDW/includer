'use strict'

var stream = require('stream')

// INC 1
// /* ##include('PATH_TO_FILE')## */

var INC_1_PREFIX = Buffer.from('/* ##include(\'')
var INC_1_SUFFIX = Buffer.from('\')## */')

var INC_1_PREFIX_L = INC_1_PREFIX.length
var INC_1_SUFFIX_L = INC_1_SUFFIX.length
var INC_1_ABS_MIN = INC_1_PREFIX_L + INC_1_SUFFIX_L

// INC 2
// <!-- ##include('PATH_TO_FILE')## -->

var INC_2_PREFIX = Buffer.from('<!-- ##include(\'')
var INC_2_SUFFIX = Buffer.from('\')## -->')

var INC_2_PREFIX_L = INC_2_PREFIX.length
var INC_2_SUFFIX_L = INC_2_SUFFIX.length
var INC_2_ABS_MIN = INC_2_PREFIX_L + INC_2_SUFFIX_L

function Includer (options) {
  stream.Transform.call(this, options)
}

Includer.prototype = Object.create(stream.Transform.prototype)
Includer.prototype.constructor = stream.Transform

Includer.prototype._transform = function (chunk, enc, cb) {

}

module.exports.Includer = Includer
