#!/usr/bin/env node

'use strict'

var fs = require('fs')

var program = require('commander')

// Replace /* ##include('PATH_TO_FILE')## */
// 21 essential characters
// PATH_TO_FILE variable

var INC_1_PREFIX = Buffer.from('/* ##include(\'')
var INC_1_SUFFIX = Buffer.from('\')## */')

var INC_1_PREFIX_L = INC_1_PREFIX.length
var INC_1_SUFFIX_L = INC_1_SUFFIX.length
var INC_1_ABS_MIN = INC_1_PREFIX_L + INC_1_SUFFIX_L

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

function includer (input, output, options) {
  var inStream, outStream
  var outError, outReady, endReached
  var potentialInclude

  var verbose = false

  if (options) {
    verbose = options.verbose
  }

  outError = null
  outReady = false

  endReached = false

  potentialInclude = null

  inStream = fs.createReadStream(input)
  outStream = fs.createWriteStream(output)

  inStream.on('error', onInError)
  inStream.on('end', onInEnd)
  inStream.once('readable', onInReadable)

  outStream.on('error', onOutError)
  outStream.on('close', onOutClose)
  outStream.on('finish', onOutFinish)
  outStream.on('drain', onOutDrain)
  outStream.on('open', onOutOpen)

  function onInError (error) {
    console.error('In stream error', error)
  }

  function onInEnd () {
    _log('In end')

    endReached = true
  }

  function onInReadable () {
    _log('In readable')

    readChunk()
  }

  function onOutError (error) {
    console.error('Out stream error', error)

    outError = error
  }

  function onOutClose () {
    _log('Out closed')
  }

  function onOutFinish () {
    _log('Out finish')
  }

  function onOutDrain () {
    _log('Out drain')
  }

  function onOutOpen () {
    _log('Out opened')

    outReady = true
  }

  function readChunk () {
    var chunk, includes

    if (!endReached) {
      chunk = inStream.read()

      if (chunk) {
        includes = []

        lookForIncludeCssJs(chunk, includes)

        processIncludes(chunk, includes, onProcessingIncludes)
      }
    }
  }

  function onProcessingIncludes () {
    _log('Processing includes finished')
  }

  function writeChunk (chunk, callback) {
    _log('Write chunk')

    if (outError) {
      callback(outError, null)
    } else if (outReady) {
      _writeChunk()
    } else {
      _log('Output not ready yet')

      outStream.once('open', _writeChunk)
    }

    function _writeChunk () {
      var cb = callback.bind(null, null, true)

      if (!outStream.write(chunk)) {
        outStream.once('drain', cb)
      } else {
        process.nextTick(cb)
      }
    }
  }

  function lookForIncludeCssJs (buffer, includes) {
    var idx, length, contentIdx, subBuffer, endIdx

    length = buffer.length
    idx = buffer.indexOf('/', 0)

    while (idx !== -1) {
      // Check location
      if (idx + INC_1_ABS_MIN < length) {
        // Check for potential include statement

        contentIdx = idx + INC_1_PREFIX_L

        subBuffer = buffer.slice(idx, contentIdx)

        if (subBuffer.equals(INC_1_PREFIX)) {
          // Possible match

          endIdx = buffer.indexOf(INC_1_SUFFIX, contentIdx)

          if (endIdx !== -1) {
            subBuffer = buffer.slice(contentIdx, endIdx)

            includes.push({
              startIndex: idx,
              endIndex: endIdx + INC_1_SUFFIX_L,
              content: subBuffer
            })

            idx = endIdx + INC_1_SUFFIX_L
          } else {
            // TODO Check for partial include
            // Store info under potential include

            idx = contentIdx
          }
        } else {
          idx++
        }
      } else {
        if (endReached) {
          idx = -1
        } else {
          // TODO Check for partial include
          // Store info under potential include

          idx = -1
        }
      }

      if (idx !== -1) idx = buffer.indexOf('/', idx)
    }
  }

  function processIncludes (buffer, includes, callback) {
    var i, length, prevEndIdx, cbCalled

    cbCalled = false

    length = includes.length

    if (length > 0) {
      prevEndIdx = 0

      i = 0

      writeInclude(buffer, prevEndIdx, includes[i], onProcessing)
    } else {
      writeChunk(buffer, _callback)
    }

    function onProcessing () {
      var workingBuffer

      _log('Processed')

      if (includes[i]) {
        prevEndIdx = includes[i].endIndex

        i++

        if (i < length) {
          writeInclude(
            buffer,
            prevEndIdx,
            includes[i],
            onProcessing
          )
        } else {
          workingBuffer = buffer.slice(
            prevEndIdx,
            buffer.length
          )

          writeChunk(workingBuffer, _callback)
        }
      }
    }

    function _callback (error, result) {
      if (!cbCalled && typeof callback === 'function') {
        callback(error, result)
      }
    }
  }

  function writeInclude (buffer, bufferStart, include, callback) {
    writeChunk(
      buffer.slice(
        bufferStart,
        include.startIndex
      ),
      onWriteChunk
    )

    function onWriteChunk () {
      writeFile(include.content, onWriteFile)
    }

    function onWriteFile (error, result) {
      callback(error, result)
    }
  }

  function writeFile (file, callback) {
    var cbCalled, fileStream

    cbCalled = false

    fileStream = fs.createReadStream(file)

    fileStream.once('error', onFileError)
    fileStream.once('end', onFileEnd)

    fileStream.pipe(outStream, { end: false })

    function onFileError (error) {
      console.error('File include error', file, error)

      _callback(error)
    }

    function onFileEnd () {
      _log('File end')
      _callback(null, true)
    }

    function _callback (error, result) {
      if (cbCalled === false &&
                typeof callback === 'function') {
        cbCalled = true

        fileStream.removeAllListeners()

        callback(error, result)
      }
    }
  }

  function _log () {
    if (verbose) console.log.apply(console, arguments)
  }
}
