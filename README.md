# gql-query-transformer

`gql-query-transformer` is a TypeScript library that converts GraphQL query strings into code using `GraphQlQuery` objects from the [@saneksa/graphql-query-builder](https://www.npmjs.com/package/@saneksa/graphql-query-builder) library. This library helps you dynamically build GraphQL queries in a programmatic way, making it easier to manage and construct complex queries in your projects.

<a href="https://www.npmjs.com/package/@saneksa/gql-query-transformer">
    <img alt="npm" src="https://img.shields.io/npm/v/@saneksa/gql-query-transformer?style=for-the-badge">
</a>

## Installation

Install the library via npm:

```sh
npm install @saneksa/gql-query-transformer
```

## Usage

Here's how you can use the `gql-query-transformer` library in your project:

### Converting to GraphQlQuery Code

```ts
import { graphqlQueryToCode } from "@saneksa/gql-query-transformer";
import gql from "graphql-tag";

const query = gql`
  query GetHero {
    hero {
      name
      friends(first: 2) {
        totalCount
        edges {
          node {
            name
          }
          cursor
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

const code = graphqlQueryToCode(query);
console.log(code);
```

### Output

The above code will output the following TypeScript code, which uses GraphQlQuery objects:

```ts
new GraphQlQuery("hero").select(
  "name",
  new GraphQlQuery("friends", { first: 2 }).select(
    "totalCount",
    new GraphQlQuery("edges").select(
      new GraphQlQuery("node").select("name"),
      "cursor"
    ),
    new GraphQlQuery("pageInfo").select("endCursor", "hasNextPage")
  )
);
```

## API

`graphqlQueryToCode(query: string | DocumentNode): string`
Converts a GraphQL query string or DocumentNode into TypeScript code that constructs GraphQlQuery objects.

- `query`: The GraphQL query string or DocumentNode to convert.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

This project is licensed under the MIT License.
