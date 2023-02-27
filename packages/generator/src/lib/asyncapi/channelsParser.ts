import { generateFromSchemaObject } from './schemaTypes'
import { Channel, ChannelItemObject, ReferenceObject } from './types'

export const generateChannels = (
  channels: Record<string, ChannelItemObject>,
  messageRefToTypeString: Record<string, string>
): Channel[] => {
  return Object.entries(channels).map(([name, channel]) =>
    generateChannel(name, channel, messageRefToTypeString)
  )
}

const generateChannel = (
  name: string,
  channel: ChannelItemObject,
  messageRefToTypeString: Record<string, string>
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
    type: generateFromSchemaObject(messageToUse?.payload),
  }
}
