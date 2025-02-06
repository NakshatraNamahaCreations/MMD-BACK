export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

export const formatTime = (time) => {
  if (!time) return null;
  const date = new Date(`1970-01-01T${time}Z`);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};
