import { graphqlQueryToCode } from "./index";

describe("graphqlQueryToCode", () => {
  it("Обработка простого запроса без вложенных селекций", () => {
    const query = `
      query {
        a(id: 5)
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(`new GraphQlQuery("a", { id: 5 })`);
  });

  it("Обработка запроса с вложенными полями", () => {
    const query = `
      query {
        a(id: 5) {
          id
          name
        }
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(
      `new GraphQlQuery("a", { id: 5 }).select("id", "name")`
    );
  });

  it("Обработка запроса с несколькими полями", () => {
    const query = `
      query {
        user {
          id
          name
        }
        posts {
          id
          title
        }
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(
      `new GraphQlQuery("user").select("id", "name"),new GraphQlQuery("posts").select("id", "title")`
    );
  });

  it("Обработка запроса с псевдонимами", () => {
    const query = `
      query {
        userAlias: user {
          id
          name
        }
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(
      `new GraphQlQuery("userAlias").select("id", "name")`
    );
  });

  it("Обработка запроса с фрагментами", () => {
    const query = `
      query {
        ...userInfo
      }
      
      fragment userInfo on User {
        id
        name
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(`"id", "name"`);
  });

  it("Обработка запроса с инлайн-фрагментами", () => {
    const query = `
      query {
        user {
          ... on Admin {
            privileges
          }
          ... on RegularUser {
            posts {
              title
            }
          }
        }
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(
      `new GraphQlQuery("user").select(new GraphQlQuery("... on Admin").select("privileges"), new GraphQlQuery("... on RegularUser").select(new GraphQlQuery("posts").select("title")))`
    );
  });

  it("Обработка пустого запроса", () => {
    const query = `
      query {
      }
    `;

    expect(() => graphqlQueryToCode(query)).toThrow();
  });

  it("Бросок ошибки на неверный запрос", () => {
    const query = `
      not_a_query {
        a
      }
    `;

    expect(() => graphqlQueryToCode(query)).toThrow();
  });

  it("Обработка запроса с несколькими уровнями вложенности", () => {
    const query = `
      query {
        user {
          id
          profile {
            bio
            social {
              twitter
              facebook
            }
          }
        }
      }
    `;

    expect(graphqlQueryToCode(query)).toBe(
      `new GraphQlQuery("user").select("id", new GraphQlQuery("profile").select("bio", new GraphQlQuery("social").select("twitter", "facebook")))`
    );
  });
});
