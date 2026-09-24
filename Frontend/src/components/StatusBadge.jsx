export default function StatusBadge({ status = "available" }) {
  const labels = {
    available: "Available",
    booked: "Booked",
    warning: "Attention",
    success: "Success",
  };
  return (
    <span className={`status-badge ${status}`}>{labels[status] || status}</span>
  );
}
