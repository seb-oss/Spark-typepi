import { formatTitle } from '../../format'
import { pathGenerator } from './paths'
import { generateTypes } from './schemaTypes'
import { OpenAPI3, ReferenceObject, Route, RoutesDefinition } from './types'
import prettier = require('prettier')

export interface GenerateOptions {
  schema: OpenAPI3
}

interface GenerateResult {
  types: Record<string, string>
  paths: Route[]
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
  const types = schema.components?.schemas
    ? generateTypes(schema.components.schemas)
    : {}

  const parameters = prepare('parameters', schema.components?.parameters)
  // const responses = prepare('responses', schema.components?.responses)
  // const requestBodies = prepare(
  //   'requestBodies',
  //   schema.components?.requestBodies
  // )

  const paths = pathGenerator(parameters).generate(schema.paths)

  return { types, paths }
}

export const generateRoutesDefinition = (routes: Route[]): RoutesDefinition => {
  const map: RoutesDefinition = {}
  return routes.reduce(
    (
      map,
      {
        url,
        method,
        requestParams,
        requestQuery,
        requestHeaders,
        requestBody,
        response,
        errorResponse,
      }
    ) => {
      if (!map[method]) map[method] = {}
      map[method][
        url
      ] = `TypedRoute<${requestParams}, ${requestQuery}, ${requestHeaders}, ${requestBody}, ${response}, ${errorResponse}>`

      return map
    },
    map
  )
}

const header = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */`

const typedRoute = `type TypedRoute<RequestParams, RequestQuery, RequestHeaders, RequestBody, Response, ErrorResponse> = {
  requestParams: RequestParams
  requestQuery: RequestQuery
  requestHeaders: RequestHeaders
  requestBody: RequestBody
  response: Response
  error: ErrorResponse
}`

export const generate = ({ schema }: GenerateOptions): string => {
  const data = generateBaseData({ schema })
  const rows: string[] = [header]

  const title = formatTitle(schema.info?.title ?? '')

  // types
  Object.values(data.types).forEach((type) => rows.push(type))

  // routes
  const map = generateRoutesDefinition(data.paths)
  rows.push(typedRoute)
  rows.push(
    `export type ${title}RoutesDefinition = {
${Object.entries(map)
  .map(
    ([method, routes]) =>
      `  ${method}: {
${Object.entries(routes)
  .map(([url, type]) => `    '${url}': ${type},`)
  .join('\n')}
  },`
  )
  .join('\n')}
}
`
  )

  return prettier.format(rows.join('\n\n'), {
    parser: 'typescript',
    semi: false,
  })
}
