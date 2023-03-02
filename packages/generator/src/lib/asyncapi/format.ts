import { formatTitle } from '../format'
import { Channel } from './types'

export const formatChannels = (title: string, channels: Channel[]) => {
  const formattedTitle = formatTitle(title)
  const rows = [] as string[]
  rows.push(`export type ${formattedTitle}Channels = {`)
  channels.forEach((channel) => {
    rows.push(`  '${channel.name}': ${channel.type},`)
  })
  rows.push('}')
  return rows
}
