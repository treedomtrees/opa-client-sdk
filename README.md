# @treedom/opa-client-sdk

<a href="https://www.treedom.net/it/organization/treedom/event/treedom-open-source?utm_source=github"><img src="https://badges.treedom.net/badge/f/treedom-open-source?utm_source=github" alt="plant-a-tree" border="0" /></a>

An undici-based client for Open Policy Agent

__Made with ❤️ at&nbsp;&nbsp;[<img src="https://assets.treedom.net/image/upload/manual_uploads/treedom-logo-contrib_gjrzt6.png" height="24" alt="Treedom" border="0" align="top" />](#-join-us-in-making-a-difference-)__, [join us in making a difference](#-join-us-in-making-a-difference-)!

## Install

```bash
npm install @treedom/opa-client-sdk
```

## Init

```ts
import { OpenPolicyAgentClient } from '@treedom/opa-client-sdk';
import { LRUCache } from 'lru-cache'

const cache = new LRUCache();

const opaClient = new OpenPolicyAgentClient({
  url: 'https://my-opa.example.com',
  cache: Cache // optional
  opaVersion: string // optional
  method?: 'POST' | 'GET' // optional
})
```

## Usage

#### Query

The query method call directly `/{opaVersion}/data/{path}` the OPA server and returns the raw body.

```ts

const { result } = await opaClient.query('data.my.policy.package', {
  input: {
    some: 'data'
  }
})
```

#### Assert

The query method call directly `/{opaVersion}/data/{path}` the OPA server and resolves if the policy matches, in any other cases it throws an error.
  
```ts
await opaClient.assert('data.my.policy.package', {
  input: {
    some: 'data'
  },
  true
})
```

#### evaluatePolicy

The query method call directly `/{opaVersion}/data/{path}` the OPA server and resolves in a boolean value that indicates whether the policy matches or not. Any other cases it throws an error.
  
```ts
await opaClient.evaluatePolicy('data.my.policy.package', {
  input: {
    some: 'data'
  },
  true
})
```

## 🌳 Join Us in Making a Difference! 🌳

We invite all developers who use Treedom's open-source code to support our mission of sustainability by planting a tree with us. By contributing to reforestation efforts, you help create a healthier planet and give back to the environment. Visit our [Treedom Open Source Forest](https://www.treedom.net/en/organization/treedom/event/treedom-open-source) to plant your tree today and join our community of eco-conscious developers.

Additionally, you can integrate the Treedom GitHub badge into your repository to showcase the number of trees in your Treedom forest and encourage others to plant new ones. Check out our [integration guide](https://github.com/treedomtrees/.github/blob/main/TREEDOM_BADGE.md) to get started.

Together, we can make a lasting impact! 🌍💚

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

## License

This project is licensed under the MIT License.