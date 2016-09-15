'use strict'

const ndjson = require('ndjson'),
      request = require('request'),
      zlib = require('zlib')

function handleResponse(stream, response) {

  if (response.statusCode >= 400) {

    var body = ''
    response.setEncoding('utf8')
    response.on('data', d => body += d)
    response.on('error', () => stream.emit('error', ({ statusCode: response.statusCode })))
    response.on('end', () => {

      try { body = JSON.parse(body) } catch(e){}
      stream.emit('error', {
        statusCode: response.statusCode,
        responseBody: body
      })
    })
  }
}

function promiseFromStreams(streams) {

  return new Promise((resolve, reject) => {

    streams.forEach((stream, i) => {

      stream.on('unpipe', () => stream.end())
      stream.on('error', error => {

        stream.end()
        reject(error)
      })

      if(i === streams.length - 1) {

        let resp
        stream.on('response', response => { resp = response; handleResponse(stream, response) })
        stream.on('end', () => resolve(resp))
      } else {
        stream.pipe(streams[i + 1])
      }
    })
  })
}

module.exports = (streams, eventWriteKey, eventSinkHost, eventSinkProtocol) => {

  if(!Array.isArray(streams)) { streams = [streams] }

  const serialize = ndjson.serialize(),
        compress = zlib.createGzip(),
        post = request.post({
          url: `${eventSinkProtocol || 'https'}://${eventSinkHost || 'event-sink.appuri.net'}/e`,
          headers: {
            'Authorization': `Bearer ${eventWriteKey}`,
            'Content-Type': 'application/x-ldjson',
            'Content-Encoding': 'gzip'
          }
        })

  return promiseFromStreams(streams.concat([serialize, compress, post]))
}
