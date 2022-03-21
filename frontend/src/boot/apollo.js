import { ApolloClient, createHttpLink } from "@apollo/client/core";
import { ApolloClients } from "@vue/apollo-composable";
import { boot } from "quasar/wrappers";
import { getClientOptions } from "src/apollo";
import { ApolloLink, concat, split } from "apollo-link";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { createApolloProvider } from "@vue/apollo-option";

const httpLink = createHttpLink({ uri: process.env.GRAPHQL_URI });

const authMiddleware = new ApolloLink(async (operation, forward) => {
  operation.setContext({
    credentials: 'include'
  });
  return forward(operation);
});

const wsLink = new WebSocketLink({
  uri: process.env.GRAPHQL_WS_URI,
  options: {
    reconnect: true,
    lazy: true,
    connectionParams: () => (
      new Promise((resolve) => {
        return resolve({ credentials: 'include' })
      })
    )
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wsLink,
  httpLink
);

const options = /* await */ getClientOptions(/* {app, router ...} */);
options.link = concat(authMiddleware, link);
const apolloClient = new ApolloClient(options);

const apolloClients = {
  default: apolloClient,
};
// Configure the options api
const apolloProvider = createApolloProvider({
  defaultClient: apolloClient,
});
export default boot(
  /* async */({ app }) => {
    // Default client.
    app.provide(ApolloClients, apolloClients);
    app.use(apolloProvider);
  }
);

export const apollo = apolloClient;
