import * as fastGlob from 'fast-glob'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { parse, join } from 'path'
import { generate as openApiGenerate, OpenAPI3 } from './openapi'

const getSchemas = async (input: string): Promise<Record<string, OpenAPI3>> => {
  const schemas: Record<string, OpenAPI3> = {}
  
  const files = fastGlob.sync(input, { globstar: true, dot: true })
  console.log(input, files)
  for (const file of files) {
    const { name } = parse(file)
    const content = await readFile(file, 'utf-8')
    schemas[name] = JSON.parse(content)
  }

  return schemas
}

export const generate = async ({ schema, input, output }): Promise<string | string[] | void> => {
  if (schema) return openApiGenerate({ schema })

  if (!input) throw new Error('You need to supply at least one schema')

  const schemas = await getSchemas(input)
  const generated = Object.entries(schemas)
    .map(([name, schema]) => ({ name, schema: openApiGenerate({ schema }) }))

  // print result
  if (!output) return generated.map(({ name, schema }) => `/**
 * ${name}
 */
${schema}
`).join('\n')
  
  // save files
  await mkdir(output, { recursive: true })
  for (const { name, schema } of generated) {
    const path = join(output, `${name}.ts`)
    await writeFile(path, schema, 'utf-8')
    console.log(path)
  }

  return
}
