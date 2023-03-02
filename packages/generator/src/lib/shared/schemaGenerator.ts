import { generateTypes } from './schemaParser'
import { Schemas } from './types'
import prettier = require('prettier')

export const generateSchemas = ({ schema }: { schema: Schemas }) => {
  const types = generateTypes(schema.schemas)

  const rows: string[] = [header]

  Object.values(types[0]).forEach((entry) => rows.push(entry))

  return prettier.format(rows.join('\n\n'), {
    parser: 'typescript',
    semi: false,
  })
}

const header = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */`
