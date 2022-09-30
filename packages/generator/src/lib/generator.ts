import { __promisify__ as glob } from 'glob'
import { readFile } from 'fs/promises'
import { generate as openApiGenerate, GenerateOptions, OpenAPI3 } from './openapi'

interface Options extends Partial<GenerateOptions> {
  input?: string
  output?: string
}

const getSchemas = async (input: string): Promise<OpenAPI3[]> => {
  const schemas: OpenAPI3[] = []
  
  const files = await glob(input)
  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    schemas.push(JSON.parse(content))
  }

  return schemas
}

export const generate = async ({ schema, input, output }): Promise<string | string[] | void> => {
  if (schema) return openApiGenerate({ schema })

  if (!input) throw new Error('You need to supply at least one schema')

  const schemas = await getSchemas(input)
  const generated = schemas.map((schema) => (
    openApiGenerate({ schema })
  ))

  if (!output) return generated
  
  // save files

  return
}
