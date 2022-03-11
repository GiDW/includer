#!/usr/bin/env node

'use strict'

var program = require('commander')

var includer = require('./src/includer.js')

program
  .arguments('<input>')
  .option('-o, --output <output>', 'output file path')
  .option('-w, --working-dir <path>', 'different working directory')
  .option('-v, --verbose', 'verbosity')
  .action(action)
  .parse(process.argv)

function action (input, prog) {
  if (prog.output) {
    includer(
      input,
      prog.output,
      {
        verbose: prog.verbose
      }
    )
  }
}
