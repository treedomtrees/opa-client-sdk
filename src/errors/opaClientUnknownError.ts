import { OpaClientError } from './opaClientError'
import { OpaQueryInput } from '../types'

export class OpaClientUnknownError<
  TInput = OpaQueryInput,
> extends OpaClientError<TInput> {
  constructor(
    resource: string,
    readonly statusCode: number,
    input?: TInput
  ) {
    super(
      `OPA unknown error occurs retrieving resource ${resource}`,
      resource,
      input
    )
  }
}
