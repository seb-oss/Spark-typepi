import { generateMessageTypes } from './schemaTypes'
import { AsyncApi, Channel, ReferenceObject } from './types'
import prettier = require('prettier')
import { generateChannels } from './channelsParser'

export interface GenerateOptions {
  schema: AsyncApi
}

interface GenerateResult {
  types: Record<string, string>
  channels: Channel[]
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
  const types = schema.components?.messages
    ? generateMessageTypes(schema.components.messages)
    : {}

  const channels = generateChannels(schema.channels)

  return { types, channels }
}

const header = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */`

export const generate = ({
  schema,
  name,
}: GenerateOptions & { name?: string }): string => {
  const data = generateBaseData({ schema })
  const rows: string[] = [header]

  // types
  Object.values(data.types).forEach((type) => rows.push(type))

  rows.push(`export type ${capitalize(name)}Channels = {`)
  data.channels.forEach((channel) => {
    rows.push(`  '${channel.name}': ${channel.type},`)
  })
  rows.push('}')

  return prettier.format(rows.join('\n\n'), {
    parser: 'typescript',
    semi: false,
  })
}

const capitalize = (str: string) => {
  if (!str || str.length === 0) {
    return str
  }
  if (str.length === 1) {
    return str.charAt(0)
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}
