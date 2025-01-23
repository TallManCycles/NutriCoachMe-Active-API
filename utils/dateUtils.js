//Gets todays date in supabase format (yyyy-mm-dd)
export function getTodaysDate() {
  let date = new Date();
  const offset = date.getTimezoneOffset();
  date = new Date(date.getTime() - offset * 60 * 1000);
  return date.toISOString().split("T")[0];
}

export function formatDate(date) {
  let newDate = new Date(date);
  const offset = newDate.getTimezoneOffset();
  newDate = new Date(date.getTime() - offset * 60 * 1000);
  return newDate.toISOString().split("T")[0];
}
