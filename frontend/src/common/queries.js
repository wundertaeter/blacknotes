const GET_TRASH = require("src/gql/queries/GetTrash.gql");
const GET_LOGBOOK = require("src/gql/queries/GetLogbook.gql");
const GET_TODAY = require("src/gql/queries/GetToday.gql");
const GET_SOMEDAY = require("src/gql/queries/GetSomeday.gql");
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const GET_ANYTIME = require("src/gql/queries/GetAnytime.gql");
const GET_UPCOMING = require("src/gql/queries/GetUpcoming.gql");
import { Store } from "src/store";
import { toDatabaseString, today, formatDate } from "src/common/date";


export function getTrash() {
    return {
        query: GET_TRASH,
        variables: {
            user_id: Store.state.user.id
        }
    }
}

export function getUpcoming() {
    return {
        query: GET_UPCOMING,
        variables: {
            user_id: Store.state.user.id,
            today: toDatabaseString(today()),
        }
    }
}

export function getLogbook() {
    return {
        query: GET_LOGBOOK,
        variables: {
            user_id: Store.state.user.id
        }
    }
}

export function getToday() {
    return {
        query: GET_TODAY,
        variables: { user_id: Store.state.user.id, today: toDatabaseString(today()) },
    }
}

export function getSomeday() {
    return {
        query: GET_SOMEDAY,
        variables: { user_id: Store.state.user.id },
    }
}

export function GetAnytime() {
    return {
        query: GET_ANYTIME,
        variables: { user_id: Store.state.user.id },
    }
}

export function getProject(id, done) {
    return {
        query: GET_PROJECT,
        variables: { id: id, done: done ? {} : { _eq: false } },
    }
}


export function getQueries(item) {
    const user = Store.state.user;
    const queries = [];
    if (item.deleted) {
        queries.push(getTrash());
        return queries;
    }

    if (item.done) {
        queries.push(getLogbook());
        return queries;
    }

    if (item.deadline) {
        const dateString = formatDate(item.deadline);
        if (dateString == "Today") {
            queries.push(getLogbook());
        } else if (dateString == "Someday") {
            queries.push(getSomeday());
        } else {
            queries.push(getUpcoming());
        }
    } else {
        queries.push(GetAnytime());
    }

    if (item.project_id) {
        queries.push(getProject(item.project_id));
    }

    return queries;
}