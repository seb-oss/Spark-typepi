export type HttpVerb = 'get' | 'post' | 'put' | 'patch' | 'delete'
export interface Route {
  url: string
  method: HttpVerb
  requestParams: string
  requestQuery: string
  requestHeaders: string
  requestBody: string
  response: string
  errorResponse: string
}

export type RoutesDefinition = Partial<Record<HttpVerb, Record<string, string>>>
