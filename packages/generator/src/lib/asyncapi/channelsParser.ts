import { generateFromSchemaObject } from './schemaTypes'
import { Channel, ChannelItemObject, ReferenceObject } from './types'

export const generateChannels = (
  channels: Record<string, ChannelItemObject>
): Channel[] => {
  return Object.entries(channels).map(([name, channel]) =>
    generateChannel(name, channel)
  )
}

const generateChannel = (name: string, channel: ChannelItemObject): Channel => {
  const messageToUse = channel.publish?.message ?? channel.subscribe?.message

  if ('$ref' in messageToUse) {
    const { $ref } = messageToUse as ReferenceObject
    return {
      name,
      type: $ref.substring($ref.lastIndexOf('/') + 1),
    }
  }

  return {
    name,
    type: generateFromSchemaObject(messageToUse?.payload),
  }
}
