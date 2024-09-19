import type { OpaQueryInput, Cache } from './types'
import { request } from 'undici'
import { getCacheKey } from './getCacheKey'
import { OpaClientAssertError } from './errors'
import { OpaClientBadRequestError } from './errors/opaClientBadRequestError'
import { OpaClientServerError } from './errors/opaClientServerError'
import { OpaClientNotFoundError } from './errors/opaClientNotFoundError'
import { OpaClientUnknownError } from './errors/opaClientUnknownError'

export type UndiciRequestOptions = Parameters<typeof request>[1]

export type OpenPolicyAgentClientProps<TCache extends Cache> = {
  url: string
  opaVersion?: string
  method?: 'POST' | 'GET'
  cache?: TCache
  requestOptions?: UndiciRequestOptions
}

type BadRequestBody = {
  warning?: {
    code: string
    message: string
  }
}

export class OpenPolicyAgentClient<TCache extends Cache> {
  public readonly cache: TCache | undefined
  private readonly url: string
  private readonly requestOptions: UndiciRequestOptions

  constructor(
    config: OpenPolicyAgentClientProps<TCache> | string,
    private readonly opaVersion = 'v1',
    private readonly method: 'POST' | 'GET' = 'POST'
  ) {
    /* istanbul ignore next */
    if (typeof config === 'object') {
      this.url = config.url

      if (config.opaVersion) {
        this.opaVersion = config.opaVersion
      }

      if (config.method) {
        this.method = config.method
      }

      if (config.cache) {
        this.cache = config.cache
      }

      if (config.requestOptions) {
        this.requestOptions = config.requestOptions
      }
    } else {
      this.url = config
    }
  }

  /**
   * Query the requested OPA resource.
   *
   * @param resource Can be expressed both in dot notation or slash notation.
   * @param input OPA Query input.
   * @throws {OpaClientBadRequestError} if the input document is invalid (ex. malformed JSON)
   * @throws {OpaClientServerError} if the server returns an error
   */
  public async query<TResponse = { result: boolean }, TInput = OpaQueryInput>(
    resource: string,
    input?: TInput
  ): Promise<TResponse> {
    const resourcePath = resource.replace(/\./gi, '/')

    const cacheKey = getCacheKey(resourcePath, input)
    const cached = this.cache?.get(cacheKey) as TResponse | undefined

    if (cached) {
      return cached
    }

    const res = await request(
      `${this.url}/${this.opaVersion}/data/${resourcePath}`,
      {
        ...this.requestOptions,
        method: this.method,
        body: input ? JSON.stringify({ input }) : undefined,
      }
    )

    if (res.statusCode === 500) {
      throw new OpaClientServerError(resource, input)
    }

    if (res.statusCode >= 400 && res.statusCode < 500) {
      const body = (await res.body.json()) as BadRequestBody
      throw new OpaClientBadRequestError(resource, input, body)
    }

    if (res.statusCode !== 200) {
      throw new OpaClientUnknownError(resource, res.statusCode, input)
    }

    const body = (await res.body.json()) as TResponse

    if (this.cache) {
      this.cache.set(cacheKey, body)
    }

    return body
  }

  /**
   * Throws if the requested OPA resource does not contain the expected result.
   *
   * @param resource Can be expressed both in dot notation or slash notation.
   * @param input OPA Query input
   * @param expected Expected result, defaults to true.
   */
  public async assert<TInput = OpaQueryInput>(
    resource: string,
    input?: TInput,
    expected = true
  ) {
    const query = await this.query(resource, input)

    if (query.result !== expected) {
      throw new OpaClientAssertError(resource, expected, input)
    }
  }

  /**
   * Returns boolean that indicates if the policy match, throws in other cases
   *
   * @param resource Can be expressed both in dot notation or slash notation.
   * @param input OPA Query input
   * @throws {OpaClientNotFoundError} if the resource not exists
   * @throws {OpaClientBadRequestError} if the input document is invalid (ex. malformed JSON)
   * @throws {OpaClientServerError} if the server returns an error
   */
  public async evaluate<TInput extends OpaQueryInput>(
    resource: string,
    input?: TInput
  ) {
    // This will throw
    const query = await this.query(resource, input)

    if (typeof query.result !== 'boolean') {
      throw new OpaClientNotFoundError(resource, input)
    }

    return query.result
  }
}
