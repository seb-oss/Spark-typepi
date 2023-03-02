import { formatFile } from '../shared/format'
import { formatImports, Import } from '../shared/imports'
import { formatParsedTypes, ParsedType, parseTypes } from '../shared/schema'
import { formatChannels } from './format'
import { parseChannels, parseMessageTypes } from './parser'
import { AsyncApi } from './specification'
import { Channel } from './types'

type Data = {
  title: string
  types: ParsedType[]
  channels: Channel[]
  imports: Import[]
}

export const generateData = (schema: AsyncApi): Data => {
  const [messages, importsFromMessages] = schema.components?.messages
    ? parseMessageTypes(schema.components.messages)
    : [{}, []]

  const [types, importsFromTypes] = schema.components?.schemas
    ? parseTypes(schema.components.schemas)
    : [[], []]

  const [channels, importsFromChannels] = parseChannels(
    schema.channels,
    messages
  )

  const allImports = importsFromMessages
    .concat(importsFromTypes)
    .concat(importsFromChannels)

  return {
    title: schema.info?.title ?? '',
    types,
    channels,
    imports: allImports,
  }
}

export const generateFormattedString = ({
  title,
  channels,
  imports,
  types,
}: Data) => {
  const formattedImports = formatImports(imports)
  const formattedTypes = formatParsedTypes(types)
  const formattedRoutes = formatChannels(title, channels)

  return formatFile([
    ...formattedImports,
    ...formattedTypes,
    ...formattedRoutes,
  ])
}

export const generate = (schema: AsyncApi): string => {
  const data = generateData(schema)

  return generateFormattedString(data)
}
