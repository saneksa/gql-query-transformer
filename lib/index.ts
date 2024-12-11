import {
  enumValue,
  type GraphQlQuery,
  type IArgumentsMap,
} from "@saneksa/graphql-query-builder";
import {
  Kind,
  parse,
  print,
  type DocumentNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type InlineFragmentNode,
  type OperationDefinitionNode,
  type SelectionNode,
  type ValueNode,
} from "graphql";

function argumentNodeToValue(node: ValueNode): any {
  switch (node.kind) {
    case Kind.VARIABLE:
      return `$${node.name.value}`;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(node.value);
    case Kind.BOOLEAN:
      return node.value;
    case Kind.STRING:
      return node.value;
    case Kind.ENUM:
      return enumValue(node.value);
    case Kind.LIST:
      return node.values.map(argumentNodeToValue);
    case Kind.OBJECT:
      return node.fields.reduce(
        (obj, field) => {
          obj[field.name.value] = argumentNodeToValue(field.value);
          return obj;
        },
        {} as Record<string, any>
      );
    case Kind.NULL:
      return null;
    default:
      throw new Error(`Unsupported argument value: ${JSON.stringify(node)}`);
  }
}

function argumentsToCode(args: IArgumentsMap): string | null {
  const entries = Object.entries(args).map(([key, value]) => {
    if (typeof value === "string") {
      return `${key}: "${value}"`;
    }

    return `${key}: ${value}`;
  });

  if (!entries.length) return null;

  return `{ ${entries.join(", ")} }`;
}

function selectionNodeToGraphQlQuery(
  selection: SelectionNode,
  fragments: Record<string, FragmentDefinitionNode>
): string | GraphQlQuery | undefined {
  if (selection.kind === Kind.FIELD) {
    return fieldNodeToGraphQlQuery(selection, fragments);
  }

  if (selection.kind === Kind.FRAGMENT_SPREAD) {
    const fragmentName = selection.name.value;
    const fragment = fragments[fragmentName];
    return fragment?.selectionSet.selections
      .map((sel: SelectionNode) => selectionNodeToGraphQlQuery(sel, fragments))
      .join(", ");
  }

  if (selection.kind === Kind.INLINE_FRAGMENT) {
    return inlineFragmentToGraphQlQuery(selection, fragments);
  }
}

function fieldNodeToGraphQlQuery(
  field: FieldNode,
  fragments: Record<string, FragmentDefinitionNode>
): string | GraphQlQuery {
  const name = field.name.value;
  const alias = field.alias ? field.alias.value : name;

  const args = field.arguments
    ? field.arguments.reduce((acc, arg) => {
        const argName = arg.name.value;
        const argValue = argumentNodeToValue(arg.value);
        acc[argName] = argValue;

        return acc;
      }, {} as IArgumentsMap)
    : {};

  const selections = field.selectionSet ? field.selectionSet.selections : [];

  if (selections.length === 0) {
    return `"${alias}"`;
  }

  const nestedQueries = selections
    .map((selection) => selectionNodeToGraphQlQuery(selection, fragments))
    .filter(Boolean);

  const argToCode = argumentsToCode(args);

  let queryBuilderCode = `new GraphQlQuery("${alias}"`;

  if (argToCode) {
    queryBuilderCode = queryBuilderCode.concat(", ", `${argToCode}`);
  }

  queryBuilderCode = queryBuilderCode.concat(")");

  return `${queryBuilderCode}.select(${nestedQueries.join(", ")})`;
}

function inlineFragmentToGraphQlQuery(
  fragment: InlineFragmentNode,
  fragments: Record<string, FragmentDefinitionNode>
): string | GraphQlQuery {
  const typeCondition = fragment.typeCondition?.name.value;
  const selections = fragment.selectionSet.selections;

  const nestedQueries = selections
    .map((selection) => selectionNodeToGraphQlQuery(selection, fragments))
    .filter(Boolean);

  return `new GraphQlQuery("... on ${typeCondition}").select(${nestedQueries.join(
    ", "
  )})`;
}

function parseFragments(
  document: DocumentNode
): Record<string, FragmentDefinitionNode> {
  return document.definitions.reduce(
    (acc, def) => {
      if (def.kind === Kind.FRAGMENT_DEFINITION) {
        acc[def.name.value] = def;
      }

      return acc;
    },
    {} as Record<string, FragmentDefinitionNode>
  );
}

export function graphqlQueryToCode(query: string | DocumentNode): string {
  const ast = parse(typeof query === "string" ? query : print(query));
  const fragments = parseFragments(ast);
  const operation = ast.definitions.find(
    (def) => def.kind === Kind.OPERATION_DEFINITION
  ) as OperationDefinitionNode;

  const selections = operation.selectionSet.selections;

  const queries = selections
    .map((selection) => selectionNodeToGraphQlQuery(selection, fragments))
    .filter(Boolean);

  return queries.join();
}
