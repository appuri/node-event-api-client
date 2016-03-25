## Appuri Event Sink Client

A NodeJS Promise-based client for sending a stream of events to [Appuri's Events API](https://appuri.readme.io/docs/event-endpoint)

### Usage

The following example uses through2 to convert a custom data format to [Appuri's Event Format](https://appuri.readme.io/docs/event-format).

```
node
const eventAPI = require('appuri-event-api-client'),
      through2 = require('through2')

function transform(chunk, enc, cb) {

    // convert custom event type to appuri event
}

eventAPI(through2.obj(transform), 'your-event-write-key')
    .then(() => console.log('Complete!'))
    .catch(error => console.log('Failed to upload: ', error))
```
