import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Clock3,
  MapPin,
  ParkingCircle,
} from "lucide-react";

export function BookingStatusBadge({ status }) {
  return (
    <span
      className={`status ${String(status).toLowerCase().replace(/\s/g, "-")}`}
    >
      {status}
    </span>
  );
}
export function QRCodeCard({ booking, onVerify }) {
  const cells = useMemo(
    () =>
      Array.from(
        { length: 169 },
        (_, i) =>
          ((booking?.token || "").charCodeAt(
            i % Math.max(1, booking?.token?.length || 1),
          ) +
            i * 17) %
            5 <
          2,
      ),
    [booking],
  );
  if (!booking) return null;
  return (
    <motion.section
      className="qr-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <span className="eyebrow">ENTRY QR</span>
      <h2>Scan at the campus entrance</h2>
      <p>Use this booking token only; it contains no personal information.</p>
      <div className="mock-qr" aria-label={`QR code for ${booking.id}`}>
        {cells.map((filled, index) => (
          <i className={filled ? "filled" : ""} key={index} />
        ))}
      </div>
      <small>Booking token: {booking.token}</small>
      <div className="qr-meta">
        <span>{booking.id}</span>
        <span>
          {booking.slot} · {booking.date}
        </span>
        <span>
          {booking.start} – {booking.end}
        </span>
      </div>
      <button className="session-primary" onClick={onVerify}>
        Open Entry Verification
      </button>
    </motion.section>
  );
}
export function CountdownTimer({ seconds = 10005, label = "Remaining" }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const h = String(Math.floor(remaining / 3600)).padStart(2, "0"),
    m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"),
    s = String(remaining % 60).padStart(2, "0");
  return (
    <div className="countdown">
      <b>
        {h}:{m}:{s}
      </b>
      <span>{label}</span>
    </div>
  );
}
export function NoShowTimer({ booking, onExpire }) {
  return (
    <div className="grace-card">
      <AlertTriangle size={19} />
      <div>
        <b>Start Parking Within 30 Minutes</b>
        <p>
          Your slot will be released automatically if parking is not started
          within the allowed grace period.
        </p>
      </div>
      <CountdownTimer seconds={1799} label="Grace period" />
      <button className="text-action" onClick={() => onExpire(booking.id)}>
        Simulate no-show
      </button>
    </div>
  );
}
export function AssignedSlotCard({ booking, onStart }) {
  const around = ["C03", "C04", booking.slot, "C06", "C07"];
  return (
    <section className="assigned-slot">
      <span className="eyebrow">ASSIGNED PARKING</span>
      <h2>Your assigned parking slot</h2>
      <div className="slot-number">{booking.slot}</div>
      <p>
        <MapPin size={16} />
        {booking.zone}
      </p>
      <p>
        {booking.vehicle} · {booking.number}
      </p>
      <div className="assigned-map">
        {around.map((slot) => (
          <i className={slot === booking.slot ? "assigned" : ""} key={slot}>
            {slot}
          </i>
        ))}
      </div>
      <button className="session-primary" onClick={onStart}>
        Start Parking
      </button>
    </section>
  );
}
export function ParkingProgress({ booking }) {
  return (
    <section className="parking-progress">
      <div>
        <span>Start</span>
        <b>{booking.start}</b>
      </div>
      <div className="progress-line">
        <i />
      </div>
      <div>
        <span>Scheduled end</span>
        <b>{booking.end}</b>
      </div>
      <small>
        <Clock3 size={14} /> Parking ends soon is shown here when the remaining
        time is low.
      </small>
    </section>
  );
}
