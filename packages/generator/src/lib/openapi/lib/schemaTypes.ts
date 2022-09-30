/* eslint-disable complexity */
import {
  ReferenceObject,
  SchemaObject
} from './types'

const getType = (prop: SchemaObject | ReferenceObject, level: number): string => {
  if ('type' in prop) {
    const schema = prop as SchemaObject
    switch (schema.type) {
      case 'object':
        return generateType(prop, level + 1)
      case 'array':
        return getType(prop.items, level + 1) + '[]'
      default:
        return prop.type
    }
  }

  if ('$ref' in prop) {
    const { $ref } = prop as ReferenceObject
    return $ref.substring($ref.lastIndexOf('/') + 1)
  }

  return 'any'
}

const pad = (level: number): string => (
  Array(level).fill('  ').join('')
)

const generateDocs = (prop: SchemaObject | ReferenceObject, level = 0): string => {
  if ('description' in prop) {
    const schema = prop as SchemaObject
    const indent = pad(level)
    return (
`${indent}/**
${indent} * ${schema.description}
${indent} */
`
    )
  } else {
    return ''
  }
}

const generateType = (schema: SchemaObject, level = 0): string => {
  const indent = pad(level)
  const nextIndent = pad(level + 1)
  
  const required = (schema.required instanceof Array) ? schema.required : []
  const props = Object.entries(schema.properties)
    .map(([name, prop]) => {
      const type = getType(prop, level)
      return {
        name,
        type,
        isRequired: required.includes(name),
        doc: generateDocs(prop, level + 1),
      }
    })
    .map(p => `${p.doc}${nextIndent}${p.name}${p.isRequired ? '' : '?'}: ${p.type}`)
  return (
`{
${props.join('\n')}
${indent}}`
  )
}

export const generateTypes = (schemas: Record<string, ReferenceObject | SchemaObject>): Record<string, string> => {
  const types = Object.entries(schemas)
    .map(([name, schema]) => {
      const doc = generateDocs(schema as SchemaObject)
      return {
        [name]: `${doc}export interface ${name} ${generateType(schema as SchemaObject)}`
      }
    })
  return Object.assign({}, ...types)
}
