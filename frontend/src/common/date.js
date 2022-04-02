import { date as qdate } from "quasar";

export const date = qdate;

export function toDatabaseString(timestamp){
    return date.formatDate(timestamp, 'YYYY-MM-DD');
}
export function today() {
    return new Date();
}
export function someday() {
    return new Date(0);
}
export function tomorrow(day) {
    return date.addToDate(day || today(), { day: 1 });
}
export function yesterday(day) {
    return date.subtractFromDate(day || today(), { day: 1 });
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
    return isToday(timestamp) || Date.parse(timestamp) - Date.parse(today()) < 0;
}
export function isTomorrow(timestamp) {
    return date.isSameDate(timestamp, tomorrow(), "day");;
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