# @typepi/express-router

A typed router for Express using typings from the @typepi/generator

## Example

```typescript
import { TypedRouter } from '@typepi/express-router'
import { RouteDefinition } from './schema'

const router = TypedRouter<RouteDefinition>()

router.get('/foo/bar/:id', [], async ({ params }, { resolve, reject }) => {
  try {
    // do stuff
    return resolve(200, { foo: 'bar' })
  } catch (err) {
    // Reject known errors
    if (err.message === 'Nope') return reject(403, 'Nope')

    // Or throw for a 500
    throw err
  }
})
```
