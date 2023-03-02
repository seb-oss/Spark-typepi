import { formatTitle } from '../format'
import { generateFromSchemaObject, generateTypes } from '../shared/schemaParser'
import { Import } from '../shared/types'
import { generateChannels } from './channelsParser'
import { AsyncApi, Channel, MessageObject, ReferenceObject } from './types'
import prettier = require('prettier')

export interface GenerateOptions {
  schema: AsyncApi
}

interface GenerateResult {
  types: Record<string, string>
  channels: Channel[]
  imports: Import[]
}

export const prepare = <T extends object>(
  name: string,
  record: Record<string, ReferenceObject | T>
): Record<string, T> => {
  const objects: Record<string, T> = {}

  if (record) {
    const allParameters = Object.entries(record)
    const referenceParameters = allParameters
      .filter((it) => '$ref' in it[1])
      .map((it) => [it[0], it[1]] as [string, ReferenceObject])
    const normalParameters = allParameters
      .filter((it) => !('$ref' in it[1]))
      .map((it) => [it[0], it[1]] as [string, T])

    normalParameters.forEach((it) => {
      objects[`#/components/${name}/${it[0]}`] = it[1]
    })

    referenceParameters.forEach((it) => {
      objects[`#/components/${name}/${it[0]}`] = objects[it[1].$ref]
    })
  }

  return objects
}

export const generateBaseData = ({
  schema,
}: GenerateOptions): GenerateResult => {
  const [messages, importsFromMessages] = schema.components?.messages
    ? generateMessageTypes(schema.components.messages)
    : [{}, []]

  const [types, importsFromTypes] = schema.components?.schemas
    ? generateTypes(schema.components.schemas)
    : [{}, []]

  const [channels, importsFromChannels] = generateChannels(
    schema.channels,
    messages
  )

  const allImports = importsFromMessages
    .concat(importsFromTypes)
    .concat(importsFromChannels)

  return { types, channels, imports: allImports }
}

const header = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */`

export const generate = ({ schema }: GenerateOptions): string => {
  const data = generateBaseData({ schema })
  const rows: string[] = [header]

  const title = formatTitle(schema.info?.title ?? '')

  const imports = data.imports
  const importsMap = imports.reduce((map, it) => {
    if (!map[it.file]) map[it.file] = []
    map[it.file].push(it.type)
    return map
  }, {} as Record<string, string[]>)

  Object.entries(importsMap).forEach(([file, types]) => {
    rows.push(`import { ${types.join(', ')} } from './${file}'`)
  })

  // types
  Object.values(data.types).forEach((entry) => rows.push(entry))

  rows.push(`export type ${title}Channels = {`)
  data.channels.forEach((channel) => {
    rows.push(`  '${channel.name}': ${channel.type},`)
  })
  rows.push('}')

  return prettier.format(rows.join('\n\n'), {
    parser: 'typescript',
    semi: false,
  })
}

const generateMessageTypes = (
  messages: Record<string, ReferenceObject | MessageObject>
): [Record<string, string>, Import[]] => {
  const imports = [] as Import[]
  const types = Object.entries(messages).map(([name, message]) => {
    const messageObj = message as MessageObject
    return {
      [`#/components/messages/${name}`]: generateFromSchemaObject(
        messageObj.payload,
        (i) => imports.push(i)
      ),
    }
  })
  return [Object.assign({}, ...types), imports]
}
