import { formatTitle } from '../format'
import { Route, RoutesDefinition } from './types'

const typedRoute = `type TypedRoute<RequestParams, RequestQuery, RequestHeaders, RequestBody, Response, ErrorResponse> = {
  requestParams: RequestParams
  requestQuery: RequestQuery
  requestHeaders: RequestHeaders
  requestBody: RequestBody
  response: Response
  error: ErrorResponse
}`

export const routeDefinitionSpec = (routes: Route[]) => {
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

export const formatRoutes = (title: string, routes: Route[]): string[] => {
  const formattedTitle = formatTitle(title)
  const rows = [] as string[]

  const map = routeDefinitionSpec(routes)

  rows.push(typedRoute)
  rows.push(
    `export type ${formattedTitle}RoutesDefinition = {
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

  return rows
}
