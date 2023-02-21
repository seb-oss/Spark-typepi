/* eslint-disable complexity */
import { MessageObject, ReferenceObject, SchemaObject } from './types'

const generateDocs = (prop: SchemaObject | ReferenceObject): string => {
  if ('description' in prop) {
    const schema = prop as SchemaObject
    return `/**
* ${schema.description}
 */
`
  } else {
    return ''
  }
}

export const generateMessageTypes = (
  messages: Record<string, ReferenceObject | MessageObject>
): Record<string, string> => {
  const types = Object.entries(messages).map(([name, message]) => {
    const messageObj = message as MessageObject
    const doc = generateDocs(messageObj.payload)
    return {
      [name]: `${doc}export type ${name} = ${generateFromSchemaObject(
        messageObj.payload
      )}`,
    }
  })
  return Object.assign({}, ...types)
}

export const generateTypes = (
  schemas: Record<string, ReferenceObject | SchemaObject>
): Record<string, string> => {
  const types = Object.entries(schemas).map(([name, schema]) => {
    const schemaObj = schema as SchemaObject
    const doc = generateDocs(schemaObj)
    return {
      [name]: `${doc}export type ${name} = ${generateFromSchemaObject(
        schemaObj
      )}`,
    }
  })
  return Object.assign({}, ...types)
}

const guessType = (schema: SchemaObject) => {
  if (schema.type) {
    return schema.type
  } else if (schema.enum) {
    return 'string'
  } else if (schema.properties) {
    return 'object'
  } else {
    return undefined
  }
}

export const generateFromSchemaObject = (
  schema: ReferenceObject | SchemaObject
): string => {
  const newLine = `\n`

  if ('$ref' in schema) {
    const { $ref } = schema as ReferenceObject
    return $ref.substring($ref.lastIndexOf('/') + 1)
  }

  const type = guessType(schema)
  let schemaString = ''
  if (type) {
    if (type === 'object') {
      schemaString = generateObject(schema, newLine)
    } else if (type === 'array') {
      schemaString = generateFromSchemaObject(schema.items) + '[]'
    } else {
      switch (type) {
        case 'integer':
          schemaString = 'number'
          break
        case 'string': {
          if (schema.format === 'date-time' || schema.format === 'date') {
            schemaString = 'Date'
          } else if (schema.enum) {
            schemaString = schema.enum.map((it) => `'${it}'`).join(' | ')
          } else {
            schemaString = 'string'
          }
          break
        }
        default:
          schemaString = type
      }
    }
  }
  if (schema.allOf) {
    const allOfString = schema.allOf
      .map((it) => generateFromSchemaObject(it))
      .join(' & ')
    if (allOfString.length > 0) {
      schemaString = schemaString + ' & ' + allOfString
    }
  }
  if (schema.anyOf) {
    const anyOfString = schema.anyOf
      .map((it) => generateFromSchemaObject(it))
      .map((it) => `Partial<${it}>`)
      .join(' & ')
    if (anyOfString.length > 0) {
      schemaString = schemaString + ' & ' + anyOfString
    }
  }

  if (schema.oneOf) {
    const oneOfString = schema.oneOf
      .map((it) => generateFromSchemaObject(it))
      .join(' | ')
    if (oneOfString.length > 0) {
      schemaString = schemaString + ' & (' + oneOfString + ')'
    }
  }

  return schemaString
}

const generateObject = (schema: SchemaObject, newLine: string) => {
  const requiredFields = schema.required ?? []
  const properties: Record<
    string,
    { value: string; required: boolean; docs: string }
  > = Object.entries(schema.properties ?? [])
    .map(([name, schema]) => ({
      [name]: {
        value: generateFromSchemaObject(schema),
        docs: generateDocs(schema),
        required: requiredFields.includes(name),
      },
    }))
    .reduce((acc, current) => {
      for (const key in current) {
        acc[key] = current[key]
      }
      return acc
    }, {})
  const allProps = Object.entries(properties)
    .map(([name, value]) => {
      return `${value.docs}${name}${value.required ? '' : '?'}: ${value.value}`
    })
    .join(`${newLine}`)
  return `{${newLine}${allProps}${newLine}}`
}
