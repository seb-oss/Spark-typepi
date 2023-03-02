import { AddImportFn, Import } from '../shared/imports'
import { generateFromSchemaObject, ReferenceObject } from '../shared/schema'
import { ChannelItemObject, MessageObject } from './specification'
import { Channel } from './types'

export const parseChannels = (
  channels: Record<string, ChannelItemObject>,
  messageRefToTypeString: Record<string, string>
): [Channel[], Import[]] => {
  const imports = [] as Import[]
  const generatedChannels = Object.entries(channels).map(([name, channel]) =>
    parseChannel(name, channel, messageRefToTypeString, (i) => imports.push(i))
  )
  return [generatedChannels, imports]
}

const parseChannel = (
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

export const parseMessageTypes = (
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
