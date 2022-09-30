export type TypedRoute<RequestParams, ResultBody, RequestBody, RequestQuery> = {
  requestParams: RequestParams
  resultBody: ResultBody
  requestBody: RequestBody
  requestQuery: RequestQuery
}
