'use strict'

const nock = require('nock'),
      through2 = require('through2')

global.should = require('chai').should()

describe('eventsink stream', function() {

  const eventsink = require('../lib/eventsink')

  function sendToEventSink(event) {

    const stream = through2.obj()
    stream.write(event)
    stream.end()

    return eventsink(stream, 'event-write-key')
  }

  it('should send objects to event sink as gzipped ldjson', function*() {

    const scope = nock('https://event-sink.appuri.net', {
        reqheaders: {
          'Content-Type': 'application/x-ldjson',
          'Content-Encoding': 'gzip'
        }
      })
      .post(
        '/e',
        '1f8b0800000000000003ab564a2dcb4bcc4d55b2522ace4ccf4b4d89cfcc53d2514acd2ba92c00099616a71601f9202a3e33052890946a666a64616ea454cb05003c55fcf93c000000')
      .query({ jsonConnectorApiKey: 'event-write-key' })
      .reply(202)

    const resp = yield sendToEventSink({ evname: 'signed_in', entype: 'user', user_id: 'be652872' })
    resp.statusCode.should.equal(202)

    scope.isDone().should.be.true
  })

  it('should throw if the response is not 202', function*() {

    const scope = nock('https://event-sink.appuri.net', {
        reqheaders: {
          'Content-Type': 'application/x-ldjson',
          'Content-Encoding': 'gzip'
        }
      })
      .post(
        '/e',
        '1f8b0800000000000003ab564a2dcb4bcc4d55b2522ace4ccf4b4d89cfcc53d2514acd2ba92c00099616a71601f9202a3e33052890946a666a64616ea454cb05003c55fcf93c000000')
      .query({ jsonConnectorApiKey: 'event-write-key' })
      .reply(400)

    try {
      yield sendToEventSink({ evname: 'signed_in', entype: 'user', user_id: 'be652872' })
      false.should.be.true
    } catch(e) {
      e.statusCode.should.equal(400)
    }

    scope.isDone().should.be.true
  })
})
