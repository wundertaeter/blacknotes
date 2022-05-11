import { date as qdate } from "quasar";

export const date = qdate;

export function toDatabaseString(timestamp) {
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
    return date.isSameDate(timestamp, tomorrow(), "day");
}
export function isYesterday(timestamp) {
    return date.isSameDate(timestamp, yesterday(), "day");
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

// export function timelineDays(timeline) {
//     const dates = [];
//     let next;
//     for (let i = 0; i <= timeline; i++) {
//         next = date.addToDate(today(), { day: i });
//         dates.push({ date: next, title: date.formatDate(next, "dddd") });
//     }
//     return dates;
// }
// 
// export function timelineMonths(timeline) {
//     const dates = [];
//     let next;
//     for (let i = 0; i <= timeline; i++) {
//         next = date.addToDate(today(), { month: i });
//         dates.push({ date: next, title: date.formatDate(next, "dddd") });
//     }
//     return dates;
// }

export function formatDateForward(timestamp) {
    if (isTomorrow(timestamp)) {
        return date.formatDate(timestamp, "D") + " Tomorrow";
    }
    const todayD = today();
    const nextWeek = date.addToDate(todayD, { day: 7 });
    if (date.isBetweenDates(timestamp, todayD, nextWeek)) {
        return date.formatDate(timestamp, "D dddd");
    }
    return date.formatDate(timestamp, "MMMM");
}

export function formatDateBackwards(timestamp) {
    if (isToday(timestamp)) {
        return "Today";
    } else if (isYesterday(timestamp)) {
        return "Yesterday";
    } else if (isCurrentWeek(timestamp)) {
        return date.formatDate(timestamp, "dddd");
    }
    return date.formatDate(timestamp, "MMMM");
}

export function repeat(startDate, endDate, frequency) {
    const dates = [];
    let nextDate = startDate;
    while (true) {
        nextDate = date.addToDate(nextDate, frequency);
        if (Date.parse(nextDate) > Date.parse(endDate)) {
            break;
        }
        dates.push(toDatabaseString(nextDate));
    }
    return dates;
}

export function parseRepeat(string){
    let [every, unit] = string.split(":");
    if (every == "week") {
        every = "day";
        unit = unit * 7;
    }
    return {[every]: unit};
}