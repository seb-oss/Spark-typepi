import { generateFromSchemaObject } from '../shared/schemaParser'
import { AddImportFn, Import } from '../shared/types'
import { Channel, ChannelItemObject, ReferenceObject } from './types'

export const generateChannels = (
  channels: Record<string, ChannelItemObject>,
  messageRefToTypeString: Record<string, string>
): [Channel[], Import[]] => {
  const imports = [] as Import[]
  const generatedChannels = Object.entries(channels).map(([name, channel]) =>
    generateChannel(name, channel, messageRefToTypeString, (i) =>
      imports.push(i)
    )
  )
  return [generatedChannels, imports]
}

const generateChannel = (
  name: string,
  channel: ChannelItemObject,
  messageRefToTypeString: Record<string, string>,
  addImport: AddImportFn
): Channel => {
  const messageToUse = channel.publish?.message ?? channel.subscribe?.message

  if ('$ref' in messageToUse) {
    const { $ref } = messageToUse as ReferenceObject
    return {
      name,
      type: messageRefToTypeString[$ref] ?? 'unknown',
    }
  }

  return {
    name,
    type: generateFromSchemaObject(messageToUse?.payload, addImport),
  }
}
