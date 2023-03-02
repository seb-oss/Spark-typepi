import { ParsedProperty, ParsedType } from './types'

const formatDocs = (description?: string): string => {
  if (description) {
    return `/**
* ${description}
 */
`
  } else {
    return ''
  }
}

const formatParsedType = (parsedType: ParsedType) => {
  return `${formatDocs(parsedType.description)}export type ${
    parsedType.name
  } = ${parsedType.type}`
}

export const formatParsedTypes = (types: ParsedType[]): string[] => {
  const rows: string[] = []

  Object.values(types).forEach((values) => rows.push(formatParsedType(values)))

  return rows
}

export const formatProperties = (properties: ParsedProperty[]) => {
  const allProps = properties
    .map(({ name, required, value, description }) => {
      return `${formatDocs(description)}${name}${required ? '' : '?'}: ${value}`
    })
    .join(`; `)
  return `{${allProps}}`
}
