import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleX, Flag, ScanLine, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { UserLayout } from "./UserPages";
import {
  AssignedSlotCard,
  BookingStatusBadge,
  CountdownTimer,
  ParkingProgress,
  QRCodeCard,
} from "../components/ParkingSession";
import {
  endParking,
  extendParking,
  getBooking,
  getBookings,
  reportParkingIssue,
  startParking,
  useBooking,
  verifyEntry,
} from "../services/bookingService";

const demoId = "PK-2026-00124";
const Modal = ({ children, onClose }) => (
  <div className="modal-wrap">
    <motion.div
      className="mock-modal session-modal"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
    >
      <button className="modal-close" onClick={onClose}>
        <X />
      </button>
      {children}
    </motion.div>
  </div>
);
export function EntryVerification() {
  const navigate = useNavigate();
  const [state, setState] = useState("scan");
  const [message, setMessage] = useState("");
  const [scanner, setScanner] = useState(null);

  const verifyGateEntry = async (gateToken) => {
    try {
      const token = localStorage.getItem("parkease_token");

      const response = await fetch(
        "http://localhost:5000/api/bookings/verify-gate-entry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gateToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.approved) {
        setMessage(data.message || "Entry could not be verified.");
        setState("denied");
        return;
      }

      setMessage(data.message || "Entry approved.");
      setState("approved");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the parking server.");
      setState("denied");
    }
  };

  const startScanner = async () => {
    try {
      setState("scan");
      setMessage("");

      const qrScanner = new Html5Qrcode("parkease-qr-reader");
      setScanner(qrScanner);

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await qrScanner.stop();
          setScanner(null);

          await verifyGateEntry(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Camera could not be started. Please allow camera permission."
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (scanner) {
        await scanner.stop();
        setScanner(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner
          .stop()
          .catch(() => {});
      }
    };
  }, [scanner]);

  const simulateScan = () => {
    verifyGateEntry("PARKEASE_MAIN_GATE_2026");
  };

  return (
    <UserLayout
      title="Parking Entry Verification"
      subtitle="Scan the ParkEase entry QR at the parking gate to verify your access."
    >
      <div className="user-content entry-page">
        {state === "scan" && (
          <motion.section
            className="scanner-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ScanLine size={35} />

            <h2>Scan the ParkEase Entry QR</h2>

            <div className="scanner-frame">
              <div id="parkease-qr-reader" />

              <i />
              <i />
              <i />
              <i />

              <span>CAMERA PREVIEW · SCAN GATE QR</span>
            </div>

            {message && (
              <p className="session-message">
                {message}
              </p>
            )}

            <div className="scanner-controls">
              <button
                className="session-primary"
                onClick={startScanner}
              >
                Scan Gate QR
              </button>

              <button
                className="session-secondary"
                onClick={simulateScan}
              >
                Simulate Scan
              </button>
            </div>
          </motion.section>
        )}

        {state === "approved" && (
          <motion.section
            className="entry-result approved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 />

            <span>ENTRY APPROVED</span>

            <h2>Your parking booking is valid.</h2>

            <p>{message}</p>

            <button
              className="session-primary"
              onClick={() => navigate("/dashboard")}
            >
              Continue to Dashboard
            </button>
          </motion.section>
        )}

        {state === "denied" && (
          <motion.section
            className="entry-result denied"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CircleX />

            <span>ENTRY DENIED</span>

            <h2>Your parking booking could not be verified.</h2>

            <p>
              {message ||
                "No valid parking booking was found for your account."}
            </p>

            <button
              className="session-primary"
              onClick={() => {
                setMessage("");
                setState("scan");
              }}
            >
              Try Again
            </button>
          </motion.section>
        )}
      </div>
    </UserLayout>
  );
}
export function AssignedSlotPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(id) || getBooking(demoId);
  return (
    <UserLayout
      title="Assigned Parking Slot"
      subtitle="Follow the highlighted campus bay to begin your session."
    >
      <div className="user-content">
        <AssignedSlotCard
          booking={booking}
          onStart={() => {
            startParking(booking.id);
            navigate("/active-parking");
          }}
        />
      </div>
    </UserLayout>
  );
}
export function ActiveParkingPage() {
  const navigate = useNavigate();
  const booking = useBooking(demoId);
  const [modal, setModal] = useState("");
  const [message, setMessage] = useState("");
  const [issue, setIssue] = useState({
    type: "Blocked Slot",
    description: "",
    number: "",
  });
  if (!booking || booking.status !== "Active")
    return (
      <UserLayout
        title="Active Parking"
        subtitle="Your active campus parking session will appear here."
      >
        <div className="user-content">
          <section className="empty-state">
            <h2>No active parking session</h2>
            <p>
              Start parking after entry verification to see your live session.
            </p>
            <Link to="/my-bookings">View My Bookings</Link>
          </section>
        </div>
      </UserLayout>
    );
  const extend = (end) => {
    const result = extendParking(booking.id, end);
    setMessage(
      result.ok
        ? `Parking extended successfully until ${result.booking.end}.`
        : `Extension unavailable: ${result.reason}`,
    );
    setModal("");
  };
  return (
    <UserLayout
      title="Active Parking"
      subtitle="Your manual parking session is currently active."
    >
      <div className="user-content active-page">
        <section className="active-hero">
          <div>
            <span>ACTIVE PARKING</span>
            <h2>
              {booking.slot} · {booking.zone}
            </h2>
            <p>
              {booking.vehicle} · {booking.number}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </section>
        <CountdownTimer seconds={10055} />
        <div className="active-details">
          <span>
            <small>STARTED</small>
            {booking.startedAt
              ? new Date(booking.startedAt).toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : booking.start}
          </span>
          <span>
            <small>SCHEDULED END</small>
            {booking.end}
          </span>
        </div>
        <ParkingProgress booking={booking} />
        {message && <p className="session-message">{message}</p>}
        <div className="active-actions">
          <button
            className="session-secondary"
            onClick={() => setModal("extend")}
          >
            Extend Parking
          </button>
          <button className="session-danger" onClick={() => setModal("end")}>
            End Parking
          </button>
          <button
            className="session-secondary"
            onClick={() => setModal("issue")}
          >
            <Flag size={16} />
            Report Parking Issue
          </button>
        </div>
      </div>
      <AnimatePresence>
        {modal === "extend" && (
          <Modal onClose={() => setModal("")}>
            <h2>Extend Parking</h2>
            <p>
              {booking.slot} · {booking.start} – {booking.end}
            </p>
            <div className="extend-options">
              {["15:30", "16:00", "16:30", "17:00"].map((end) => (
                <button key={end} onClick={() => extend(end)}>
                  {new Date(`2026-01-01T${end}`).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          </Modal>
        )}
        {modal === "end" && (
          <Modal onClose={() => setModal("")}>
            <h2>End Parking Session?</h2>
            <p>Are you sure you have left the parking slot?</p>
            <button
              className="session-danger"
              onClick={() => {
                endParking(booking.id);
                navigate("/booking-history");
              }}
            >
              End Parking
            </button>
          </Modal>
        )}
        {modal === "issue" && (
          <Modal onClose={() => setModal("")}>
            <h2>Report Parking Issue</h2>
            <select
              value={issue.type}
              onChange={(e) => setIssue({ ...issue, type: e.target.value })}
            >
              {[
                "Wrong Parking",
                "Blocked Slot",
                "Unauthorized Vehicle",
                "Other",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <textarea
              value={issue.description}
              onChange={(e) =>
                setIssue({ ...issue, description: e.target.value })
              }
              placeholder="Describe the issue"
            />
            <input
              value={issue.number}
              onChange={(e) => setIssue({ ...issue, number: e.target.value })}
              placeholder="Vehicle number (optional)"
            />
            <button
              className="session-primary"
              onClick={() => {
                reportParkingIssue({ ...issue, slot: booking.slot });
                setModal("");
                setMessage("Report submitted successfully.");
              }}
            >
              Submit report
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </UserLayout>
  );
}
export function BookingQRCode({ id = demoId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId =
    new URLSearchParams(location.search).get("booking") ||
    getBookings()[0]?.id ||
    id;
  const booking = useBooking(bookingId) || getBookings()[0];
  return (
    <UserLayout
      title="Entry QR"
      subtitle="Present this token at the campus parking entrance."
    >
      <div className="user-content">
        <QRCodeCard
          booking={booking}
          onVerify={() => navigate(`/entry-verification?booking=${booking.id}`)}
        />
      </div>
    </UserLayout>
  );
}
function BookingSummary({ booking }) {
  return (
    <div className="entry-summary">
      {[
        ["Booking ID", booking.id],
        ["Vehicle", booking.vehicle],
        ["Vehicle Number", booking.number],
        ["Vehicle Type", booking.vehicle],
        ["Parking Slot", booking.slot],
        ["Zone", booking.zone],
        ["Date", booking.date],
        ["Time", `${booking.start} – ${booking.end}`],
      ].map(([key, value]) => (
        <div key={key}>
          <small>{key}</small>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
