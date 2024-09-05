import { beforeEach, test } from 'node:test'
import {
  deepStrictEqual,
  doesNotThrow,
  throws,
  rejects,
  doesNotReject,
} from 'node:assert'

import { OpenPolicyAgentClient } from '../lib'
import { MockAgent, setGlobalDispatcher } from 'undici'
import { Interceptable } from 'undici/types/mock-interceptor'
import { LRUCache } from 'lru-cache'
import { OpaClientServerError } from '../lib/errors/opaClientServerError'
import { OpaClientBadRequestError } from '../lib/errors/opaClientBadRequestError'
import { OpaClientNotFoundError } from '../lib/errors/opaClientNotFoundError'
import { OpaClientUnknownError } from '../lib/errors/opaClientUnknownError'

const opaUrl = 'https://opa.test'

let agent: MockAgent
let opaInterceptor: Interceptable

beforeEach(() => {
  agent = new MockAgent()
  agent.disableNetConnect()
  setGlobalDispatcher(agent)

  opaInterceptor = agent.get(opaUrl)
})

test('constructor', async (t) => {
  await t.test('should use opaVersion specified', async () => {
    opaInterceptor
      .intercept({
        path: '/v2/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      opaVersion: 'v2',
    })

    const queryResult = await opaClient.query('my.resource.allow')

    deepStrictEqual(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test('should use method specified', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'GET',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      method: 'GET',
    })

    const queryResult = await opaClient.query('my.resource.allow')

    deepStrictEqual(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })
})

test('query function', async (t) => {
  await t.test('should query requested resource', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const queryResult = await opaClient.query('my.resource.allow')

    deepStrictEqual(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test('should query requested resource with payload', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply((req) => {
        deepStrictEqual(
          JSON.parse(req.body as string),
          {
            input: { test: 'data' },
          },
          'request body should contain expected input'
        )

        return {
          statusCode: 200,
          data: JSON.stringify({
            result: true,
          }),
        }
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const queryResult = await opaClient.query('my.resource.allow', {
      test: 'data',
    })

    deepStrictEqual(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test('should query cached requested resource', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient({
      url: opaUrl,
      cache: new LRUCache({
        max: 100,
      }),
    })

    const queryResult = await opaClient.query('my.resource.allow')
    deepStrictEqual(
      queryResult,
      { result: true },
      'query response should match expected'
    )

    const cachedQueryResult = await opaClient.query('my.resource.allow')
    deepStrictEqual(
      cachedQueryResult,
      { result: true },
      'cached query response should match expected'
    )

    throws(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should not have been called'
    )
  })

  await t.test(
    'should query cached requested resource twice due to cache clear',
    async () => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {
          result: true,
        })

      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {
          result: true,
        })

      const opaClient = new OpenPolicyAgentClient({
        url: opaUrl,
        cache: new LRUCache({
          max: 100,
        }),
      })

      const queryResult1 = await opaClient.query('my.resource.allow')
      deepStrictEqual(
        queryResult1,
        { result: true },
        'query response should match expected'
      )

      opaClient.cache?.clear()

      const queryResult2 = await opaClient.query('my.resource.allow')
      deepStrictEqual(
        queryResult2,
        { result: true },
        'cached query response should match expected'
      )

      doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )

  await t.test(
    'should throw when the server returns 500 status code',
    async () => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(500, {
          error: true,
        })

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      rejects(
        () => opaClient.query('my.resource.allow'),
        new OpaClientServerError('my.resource.allow', undefined),
        'should throw when the server returns 500 status code'
      )

      doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )

  await t.test(
    'should throw when the server returns 400 status code',
    async () => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(400, {
          warning: {
            code: 'invalid_input',
            message: 'Invalid input',
          },
        })

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      rejects(
        () => opaClient.query('my.resource.allow'),
        new OpaClientBadRequestError('my.resource.allow', undefined, {
          warning: {
            code: 'invalid_input',
            message: 'Invalid input',
          },
        }),
        'should throw when the server returns 400 status code'
      )

      doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )

  await t.test(
    'should throw when the server returns a status code that not match 200',
    async () => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(300, {})

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      rejects(
        () => opaClient.query('my.resource.allow'),
        new OpaClientUnknownError('my.resource.allow', 300, undefined),
        "should throw when the server returns a status code that doesn't match 200"
      )

      doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )
})

test('assert function', async (t) => {
  await t.test('should not reject when assert succeeds', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    doesNotReject(
      () => opaClient.assert('my.resource.allow'),
      'assert should resolve'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test('should reject when assert fails', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: false,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    rejects(() => opaClient.assert('my.resource.allow'), 'assert should reject')

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })
})

test('evaluatePolicy function', async (t) => {
  await t.test('should return true when policy match', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: true,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const evaluatePolicyResult =
      await opaClient.evaluatePolicy('my.resource.allow')

    deepStrictEqual(
      evaluatePolicyResult,
      true,
      'evaluatePolicy response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test('should return false when policy not match', async () => {
    opaInterceptor
      .intercept({
        path: '/v1/data/my/resource/allow',
        method: 'POST',
      })
      .reply(200, {
        result: false,
      })

    const opaClient = new OpenPolicyAgentClient(opaUrl)

    const evaluatePolicyResult =
      await opaClient.evaluatePolicy('my.resource.allow')

    deepStrictEqual(
      evaluatePolicyResult,
      false,
      'evaluatePolicy response should match expected'
    )

    doesNotThrow(
      () => agent.assertNoPendingInterceptors(),
      'all request interceptors should have been called'
    )
  })

  await t.test(
    'should throw when the response not contains result property',
    async () => {
      opaInterceptor
        .intercept({
          path: '/v1/data/my/resource/allow',
          method: 'POST',
        })
        .reply(200, {})

      const opaClient = new OpenPolicyAgentClient(opaUrl)

      rejects(
        () => opaClient.evaluatePolicy('my.resource.allow'),
        new OpaClientNotFoundError('my.resource.allow', undefined),
        'should throw when the response not contains result property'
      )

      doesNotThrow(
        () => agent.assertNoPendingInterceptors(),
        'all request interceptors should have been called'
      )
    }
  )
})
