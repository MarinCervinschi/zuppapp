// Numbers and dates as Italians write them, in one place: «12.345», «4,7», «3 maggio 2026».

const whole = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const upToOneDecimal = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const oneDecimal = new Intl.NumberFormat("it-IT", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});
const longDate = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });
const dayMonth = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" });
const dateTime = new Intl.DateTimeFormat("it-IT", {
	dateStyle: "medium",
	timeStyle: "short",
});

type When = string | number | Date;

/** «12.345»: a count. */
export const formatNumber = (n: number) => whole.format(n);

/** «2,5», «3»: a quantity, at most one decimal. */
export const formatAmount = (n: number) => upToOneDecimal.format(n);

/** «4,7», «4,0»: a mean of stars, always with its decimal. */
export const formatStars = (mean: number) => oneDecimal.format(mean);

/** «3 maggio 2026». */
export const formatDate = (when: When) => longDate.format(new Date(when));

/** «3 maggio». */
export const formatDayMonth = (when: When) => dayMonth.format(new Date(when));

/** «3 mag 2026, 14:05». */
export const formatDateTime = (when: When) => dateTime.format(new Date(when));
