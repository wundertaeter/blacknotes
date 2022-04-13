const GET_TRASH = require("src/gql/queries/GetTrash.gql");
const GET_LOGBOOK = require("src/gql/queries/GetLogbook.gql");
const GET_TODAY = require("src/gql/queries/GetToday.gql");
const GET_SOMEDAY = require("src/gql/queries/GetSomeday.gql");
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const GET_ANYTIME = require("src/gql/queries/GetAnytime.gql");
import { Store } from "src/store";


export function getQueries(item) {
    const user = Store.state.user;
    const queries = [];
    if (item.deleted) {
        queries.push({
            query: GET_TRASH,
            variables: { user_id: user.id },
        });
        return queries;
    }

    if (item.done) {
        queries.push({
            query: GET_LOGBOOK,
            variables: { user_id: user.id },
        });
        return queries;
    }

    if (item.deadline) {
        const dateString = formatDate(item.deadline);
        if (dateString == "Today") {
            queries.push({
                query: GET_TODAY,
                variables: { user_id: user.id },
            });
        } else if (dateString == "Someday") {
            queries.push({
                query: GET_SOMEDAY,
                variables: { user_id: user.id },
            });
        }
    } else {
        queries.push(GET_ANYTIME);
    }

    if (item.project_id) {
        queries.push({
            query: GET_PROJECT,
            variables: { id: item.project_id },
        });
    }

    return queries;
}