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

var MAX_INCLUDE_PATTERN_LENGTH = 512

function Includer (options) {
  stream.Transform.call(this, options)
  this._includerBuffer = Buffer.alloc(MAX_INCLUDE_PATTERN_LENGTH)
  this._includerBufferFilled = false
  this._includerCandidate = null
  this._includerCandidateIdx = -1
}

Includer.prototype = Object.create(stream.Transform.prototype)
Includer.prototype.constructor = stream.Transform

Includer.prototype._transform = function (chunk, enc, cb) {
  var buffer, inc1Idxs, inc2Idxs, matches, length, i, match
  if (chunk) {
    buffer = this._includerBufferFilled
      ? Buffer.concat(this._includerBuffer, chunk)
      : chunk

    inc1Idxs = searchPatterns(buffer, INC_1_PREFIX, INC_1_SUFFIX)
    inc2Idxs = searchPatterns(buffer, INC_2_PREFIX, INC_2_SUFFIX)
    matches = inc1Idxs.concat(inc2Idxs)
    matches.sort(comparePatternMatches)

    length = matches.length
    for (i = 0; i < length; i++) {
      match = matches[i]
      
    }
  }
}

module.exports.Includer = Includer

function searchPatterns (
  input,
  patternPrefix,
  patternSuffix
) {
  var result, idxPre, idxSuff
  result = []
  idxPre = 0
  do {
    idxPre = input.indexOf(patternPrefix, idxPre)
    if (idxPre > -1) {
      idxSuff = input.indexOf(patternSuffix, idxPre)
      if (idxSuff > -1) {
        result.push([
          idxPre,
          idxSuff,
          input.toString('utf8', idxPre + patternPrefix.length, idxSuff)
        ])
      }
    }
  } while (idxPre > -1)
  return result
}

function comparePatternMatches (a, b) {
  return a[0] - b[0]
}
