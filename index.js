'use strict'

const ndjson = require('ndjson'),
      request = require('request'),
      zlib = require('zlib')

module.exports = (readableObjectStream, eventWriteKey) => {

  const options = {
          url: `https://event-sink.appuri.net/e?jsonConnectorApiKey=${eventWriteKey}`,
          headers: {
            'Content-Type': 'application/x-ldjson',
            'Content-Encoding': 'gzip'
          }
        },
        serialize = ndjson.serialize(),
        compress = zlib.createGzip(),
        post = request.post(options)

  readableObjectStream
    .pipe(serialize)
    .pipe(compress)
    .pipe(post)

  return new Promise((resolve, reject) => {

    let resp

    readableObjectStream.on('error', reject)
    serialize.on('error', reject)
    compress.on('error', reject)
    post.on('error', reject)
    post.on('response', response => {
      resp = response
      if (response.statusCode >= 400) {
        var body = ''
        response.setEncoding('utf8')
        response.on('data', d => body += d)
        response.on('error', () => reject({ statusCode: response.statusCode }))
        response.on('end', () => {
          try { body = JSON.parse(body) } catch(e){}
          reject({
            statusCode: response.statusCode,
            responseBody: body
          })
        })
      }
    })

    post.on('end', () => resolve(resp))
  })
}
