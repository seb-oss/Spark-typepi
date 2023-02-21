import * as fastGlob from 'fast-glob'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { parse, join } from 'path'
import { generate as openApiGenerate, OpenAPI3 } from './openapi'
import { generate as asyncApiGenerate, AsyncApi } from './asyncapi'
import { parse as yamlParse } from 'yaml'

type ParsedSchemas = {
  openApi: Record<string, OpenAPI3>
  asyncApi: Record<string, AsyncApi>
}

const getSchemas = async (input: string): Promise<ParsedSchemas> => {
  const schemas: ParsedSchemas = {
    openApi: {},
    asyncApi: {},
  }

  const files = fastGlob.sync(input, { globstar: true, dot: true })
  for (const file of files) {
    const { name } = parse(file)
    const content = await readFile(file, 'utf-8')
    const parsed =
      file.endsWith('.yaml') || file.endsWith('.yml')
        ? yamlParse(content)
        : JSON.parse(content)

    if (parsed['asyncapi']) {
      schemas.asyncApi[name] = parsed
    } else {
      schemas.openApi[name] = parsed
    }
  }

  return schemas
}

export const generate = async ({
  schema,
  input,
  output,
}): Promise<string | string[] | void> => {
  if (schema) return openApiGenerate({ schema })

  if (!input) throw new Error('You need to supply at least one schema')

  const schemas = await getSchemas(input)
  const generatedOpenApi = Object.entries(schemas.openApi).map(
    ([name, schema]) => ({
      name,
      schema: openApiGenerate({ name, schema }),
    })
  )

  const generatedAsyncApi = Object.entries(schemas.asyncApi).map(
    ([name, schema]) => ({
      name,
      schema: asyncApiGenerate({ name, schema }),
    })
  )

  // print result
  if (!output)
    return generatedOpenApi
      .concat(generatedAsyncApi)
      .map(
        ({ name, schema }) => `/**
 * ${name}
 */
${schema}
`
      )
      .join('\n')

  // save files
  await mkdir(output, { recursive: true })
  for (const { name, schema } of generatedOpenApi.concat(generatedAsyncApi)) {
    const path = join(output, `${name}.ts`)
    await writeFile(path, schema, 'utf-8')
  }

  return
}
