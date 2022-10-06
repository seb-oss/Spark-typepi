import { generatePaths } from './paths'
import { generateTypes } from './schemaTypes'
import { OpenAPI3, Route, RoutesDefinition } from './types'

export interface GenerateOptions {
  schema: OpenAPI3
}

interface GenerateResult {
  types: Record<string, string>
  paths: Route[]
}

export const generateBaseData = ({ schema }: GenerateOptions): GenerateResult => {
  const types = (schema.components?.schemas)
    ? generateTypes(schema.components.schemas)
    : {}
  
  const paths = generatePaths(schema.paths)

  return { types, paths }
}

export const generateRoutesDefinition = (routes: Route[]): RoutesDefinition => {
  const map: RoutesDefinition = {}
  return routes.reduce((map, { url, method, requestParams, requestQuery, requestHeaders, requestBody, response, errorResponse }) => {
    if (!map[method]) map[method] = {}
    map[method][url] = `TypedRoute<${requestParams}, ${requestQuery}, ${requestHeaders}, ${requestBody}, ${response}, ${errorResponse}>`
    
    return map
  }, map)
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

  // types
  Object.values(data.types).forEach((type) => rows.push(type))

  // routes
  const map = generateRoutesDefinition(data.paths)
  rows.push(typedRoute)
  rows.push(
`export type RoutesDefinition = {
${Object.entries(map).map(([method, routes]) => (
`  ${method}: {
${Object.entries(routes).map(([url, type]) => (
`    '${url}': ${type},`
)).join('\n')}
  },`  
)).join('\n')}
}
`
  )


  return rows.join('\n\n')
}
