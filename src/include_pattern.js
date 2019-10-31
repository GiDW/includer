'use strict'

function IncludePattern (prefix, suffix) {
  this.prefix = prefix
  this.suffix = suffix
  this.preLength = this.prefix.length
  this.suffLength = this.suffix.length
  this.absMinLength = this.preLength + this.suffLength
}

module.exports = IncludePattern
