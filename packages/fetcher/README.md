# @typepi/fetcher

A typed fetcher using typings from the @typepi/generator

## Example

```typescript
import { Fetcher } from '@typepi/fetcher'
import { RouteDefinition } from './schema'

const myApi = new Fetcher<RouteDefinition>()

const response1 = myApi.get('/foo/bar/:id', {
  params: { id: 5 },
  query: { foo: 'bar' },
})
const response2 = myApi.post('/foo/bar', { data: 'hello' })
const response3 = myApi.get('/foo/bar')
```

In node.js, supply a fetch implementation

```typescript
import fetch from 'node-fetch'
import { Fetcher } from '@typepi/fetcher'
import { RouteDefinition } from './schema'

const myApi = new Fetcher<RouteDefinition>({
  server: 'https://myapi.org',
  fetch,
})

const response1 = myApi.get('/foo/bar/:id', { id: 5 }, { foo: 'bar' })
const response2 = myApi.post('/foo/bar', { data: 'hello' })
const response3 = myApi.get('/foo/bar')
```
