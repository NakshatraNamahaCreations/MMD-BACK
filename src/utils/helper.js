export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

export const formatTime = (time) => {
  if (!time || typeof time !== "string") return null;

  try {
    const [hourMinute, period] = time.trim().split(" ");
    const [hour, minute] = hourMinute.split(":");

    let hours = parseInt(hour, 10);
    if (period?.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (period?.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(parseInt(minute, 10));
    date.setSeconds(0);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Invalid time format:", time, error);
    return null;
  }
};
