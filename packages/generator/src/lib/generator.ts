import * as fastGlob from 'fast-glob'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, parse } from 'path'
import { parse as yamlParse } from 'yaml'
import { AsyncApi, generate as asyncApiGenerate } from './asyncapi'
import { generateOpenApi, OpenAPI3 } from './openapi'
import { Components, generateSchemas } from './shared/schema'

type ParsedSchemas = {
  openApi: Record<string, OpenAPI3>
  asyncApi: Record<string, AsyncApi>
  sharedTypes: Record<string, Components>
}

const getSchemas = async (input: string): Promise<ParsedSchemas> => {
  const schemas: ParsedSchemas = {
    openApi: {},
    asyncApi: {},
    sharedTypes: {},
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
    } else if (parsed['openapi']) {
      schemas.openApi[name] = parsed
    } else if (parsed['components']) {
      schemas.sharedTypes[name] = parsed
    }
  }

  return schemas
}

export const generate = async ({
  input,
  output,
}): Promise<string | string[] | void> => {
  if (!input) throw new Error('You need to supply at least one schema')

  const schemas = await getSchemas(input)

  const generatedOpenApi = Object.entries(schemas.openApi).map(
    ([name, schema]) => ({
      name,
      schema: generateOpenApi(schema),
    })
  )

  const generatedAsyncApi = Object.entries(schemas.asyncApi).map(
    ([name, schema]) => ({
      name,
      schema: asyncApiGenerate(schema),
    })
  )

  const generatedSharedTypes = Object.entries(schemas.sharedTypes).map(
    ([name, schema]) => ({
      name,
      schema: generateSchemas(schema),
    })
  )

  // print result
  if (!output)
    return generatedOpenApi
      .concat(generatedAsyncApi)
      .concat(generatedSharedTypes)
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
  for (const { name, schema } of generatedOpenApi
    .concat(generatedAsyncApi)
    .concat(generatedSharedTypes)) {
    const path = join(output, `${name}.ts`)
    await writeFile(path, schema, 'utf-8')
  }

  return
}
