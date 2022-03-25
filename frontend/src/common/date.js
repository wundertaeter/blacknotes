import { date as qdate } from "quasar";

export const date = qdate;

export function today() {
    return new Date();
}
export function someday() {
    return new Date(0);
}
export function isFuture(timestamp) {
    return Date.parse(timestamp) >= Date.parse(today());
}
export function isToday(timestamp) {
    return date.isSameDate(timestamp, today(), "day");
}
export function isSomeday(timestamp) {
    return Date.parse(timestamp) == Date.parse(someday());
}
export function isTodayOrLess(timestamp) {
    return Date.parse(timestamp) - Date.parse(today()) < 0;
}
export function isTomorrow(timestamp) {
    return Date.parse(timestamp) - date.addToDate(today(), { day: 1 }) < 0;
}
export function isCurrentWeek(timestamp) {
    return (
        date.getWeekOfYear(new Date(timestamp)) ==
        date.getWeekOfYear(today())
    );
}
export function formatDate(timestamp, format) {
    if (isSomeday(timestamp)) {
        return "Someday";
    } else if (isTodayOrLess(timestamp)) {
        return "Today";
    } else if (isTomorrow(timestamp)) {
        return "Tomorrow";
    } else if (isCurrentWeek(timestamp)) {
        return date.formatDate(timestamp, "dddd");
    }
    return date.formatDate(timestamp, format);
}