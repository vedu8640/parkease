import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  CalendarDays,
  Car,
  Check,
  CircleAlert,
  Clock3,
  LayoutDashboard,
  MapPin,
  ParkingCircle,
} from "lucide-react";
import { getSlotStatus, makeSlots } from "../services/parkingService";
import { getMockBooking, saveMockBooking } from "../services/bookingService";
import { request } from "../services/api";
import { useAuthenticatedUser } from "../services/authService";

// Parking can be reserved in five-minute increments, such as 10:00–10:30.
const SLOT_INTERVAL_MINUTES = 5;
const times = Array.from({ length: (24 * 60) / SLOT_INTERVAL_MINUTES }, (_, index) => {
  const totalMinutes = index * SLOT_INTERVAL_MINUTES;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

const prettyTime = (time) =>
  new Date(`2026-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

const dateLabel = (date) =>
  new Date(`${date}T00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Get today's date dynamically in local time
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function ParkingShell({ children }) {
  return (
    <>
      <header className="parking-nav">
        <Link to="/" className="logo">
          <span>
            <ParkingCircle size={20} />
          </span>
          ParkEase
        </Link>

        <div>
          <Link to="/dashboard">
            <LayoutDashboard size={16} /> Dashboard
          </Link>

          <Link to="/parking" className="parking-nav-cta">
            Find Parking
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </>
  );
}

function Steps({ step }) {
  return (
    <div className="booking-steps">
      {["Vehicle", "Slot", "Date & Time", "Confirm"].map((name, index) => {
        const n = index + 1;

        return (
          <div
            className={
              n < step ? "complete" : n === step ? "current" : ""
            }
            key={name}
          >
            <span>{n < step ? <Check size={14} /> : `0${n}`}</span>
            <b>{name}</b>
          </div>
        );
      })}
    </div>
  );
}

function VehicleToggle({ type, setType }) {
  return (
    <div className="parking-type-toggle">
      {[
        ["Car", Car],
        ["Bike", Bike],
      ].map(([name, Icon]) => (
        <button
          key={name}
          className={type === name ? "active" : ""}
          onClick={() => setType(name)}
        >
          <Icon size={20} />
          <span>{name} Parking</span>

          <small>
            {name === "Car"
              ? "Wider campus bays"
              : "Compact two-wheeler bays"}
          </small>
        </button>
      ))}
    </div>
  );
}

function SlotCard({ slot, status, selected, onSelect }) {
  const Icon = slot.type === "Car" ? Car : Bike;

  return (
    <motion.button
      initial={{ opacity: 0, y: 9 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(Number(slot.id.slice(1)) * 0.012, 0.35),
      }}
      className={`slot-card ${slot.type.toLowerCase()} ${status} ${
        selected ? "selected" : ""
      }`}
      onClick={onSelect}
    >
      <span className="slot-id">{slot.id}</span>

      <Icon size={slot.type === "Car" ? 25 : 20} />

      <b>
        {selected
          ? "Selected"
          : status === "available"
          ? "Available"
          : status === "booked"
          ? "Booked"
          : "Unavailable"}
      </b>

      {selected && (
        <i>
          <Check size={12} />
        </i>
      )}
    </motion.button>
  );
}

function Legend() {
  return (
    <div className="parking-legend">
      <span>
        <i className="available" />
        Available
      </span>

      <span>
        <i className="booked" />
        Booked
      </span>

      <span>
        <i className="selected" />
        Selected
      </span>

      <span>
        <i className="unavailable" />
        Unavailable
      </span>
    </div>
  );
}

export function ParkingPage({ initialType }) {
  const navigate = useNavigate();
  const user = useAuthenticatedUser();

  const today = getToday();

  const [type, setType] = useState(initialType || "Car");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("15:00");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [liveSlots, setLiveSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const validTime = start < end;

  useEffect(() => {
    if (!initialType && user?.vehicleType) setType(user.vehicleType === "car" ? "Car" : "Bike");
    if (user?.vehicleNumber) setVehicleNumber((current) => current || user.vehicleNumber);
  }, [initialType, user?.vehicleType, user?.vehicleNumber]);

  useEffect(() => {
    let active = true;
    const startTime = new Date(`${date}T${start}:00`).toISOString();
    const endTime = new Date(`${date}T${end}:00`).toISOString();
    setLoadingSlots(true);
    request(`/slots?vehicleType=${type.toLowerCase()}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
      .then((data) => active && setLiveSlots(data.slots || []))
      .catch((error) => active && setNotice(error.message))
      .finally(() => active && setLoadingSlots(false));
    return () => { active = false; };
  }, [type, date, start, end]);
  const slots = useMemo(() => liveSlots
    .map((slot) => ({ ...slot, id: slot.slotNumber, number: slot.slotNumber, type: slot.vehicleType === "car" ? "Car" : "Bike", unavailable: slot.availabilityStatus === "disabled" })), [liveSlots]);

  const vehicle = vehicleNumber.trim() ? { number: vehicleNumber.trim().toUpperCase(), type } : null;

  function changeType(next) {
    setType(next);
    setSelected(null);
    setNotice("");
  }

  function choose(slot, status) {
    if (!validTime) {
      setNotice("Please select a valid time range first.");
      return;
    }

    if (status !== "available") {
      setNotice(
        status === "booked"
          ? "This slot is already booked for the selected time."
          : "This slot is currently unavailable."
      );
      return;
    }

    setNotice("");
    setSelected(slot);
  }

  function continueBooking() {
    if (!validTime) {
      return setNotice("End time must be later than start time.");
    }

    if (!selected) {
      return setNotice(
        "Choose an available parking slot to continue."
      );
    }
    if (!vehicle) return setNotice("Enter the vehicle number you are bringing before continuing.");

    const payload = {
      vehicleType: type,
      vehicle,
      slot: selected,
      date,
      start,
      end,
      slotId: selected._id,
    };

    sessionStorage.setItem(
      "parkease-draft-booking",
      JSON.stringify(payload)
    );

    navigate("/booking");
  }

  return (
    <ParkingShell>
      <section className="parking-page">
        <div className="parking-head">
          <span className="eyebrow">Campus Parking</span>

          <h1>Find Your Parking</h1>

          <p>
            Choose your vehicle and reserve a suitable campus parking
            slot.
          </p>
        </div>

        <Steps step={selected ? 3 : 1} />

        <VehicleToggle type={type} setType={changeType} />

        <section className="parking-controls">
          <label>
            <span>Vehicle Number</span>
            <input
              value={vehicleNumber}
              onChange={(event) => setVehicleNumber(event.target.value.toUpperCase())}
              placeholder="Enter the vehicle number for this booking"
            />
          </label>
          {/* Calendar Date Picker */}
          <label className="date-control">
            <span>Date</span>

            <div>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelected(null);
                  setNotice("");
                }}
              />
            </div>
          </label>

        <label>
  <span>Start Time</span>
  <select
  value={start}
  onChange={(e) => setStart(e.target.value)}
>
  {times.map((t) => (
   <option key={t} value={t}>{prettyTime(t)}</option>
  ))}
</select>
</label>

<label>
  <span>End Time</span>

  <select
    value={end}
    onChange={(e) => setEnd(e.target.value)}
  >
    {times.map((t) => (
      <option key={t} value={t}>{prettyTime(t)}</option>
    ))}
  </select>
</label>
        </section>

        {!validTime && (
          <p className="parking-error">
            <CircleAlert size={15} />
            End time must be later than start time.
          </p>
        )}

        <div className="parking-grid-title">
          <div>
            <h2>{type} Parking</h2>

            <p>
              Available for selected time
            </p>
          </div>

          <Legend />
        </div>

        <div className={`parking-layout ${type.toLowerCase()}`}>
          <div className="map-mark entry">
            MAIN ENTRY <ArrowRight size={13} />
          </div>

          <div className="driveway">CAMPUS DRIVEWAY</div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${type}-${date}-${start}-${end}`}
              className={`slot-grid ${type.toLowerCase()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loadingSlots ? <p>Loading available slots...</p> : slots.map((slot) => {
                const status = slot.availabilityStatus === "disabled" ? "unavailable" : (slot.availabilityStatus || "available");

                return (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    status={status}
                    selected={selected?.id === slot.id}
                    onSelect={() => choose(slot, status)}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>

        </div>

        {notice && (
          <p className="parking-error">
            <CircleAlert size={15} />
            {notice}
          </p>
        )}

        <section className="selection-bar">
          <div>
            {selected ? (
              <>
                <span className="selected-mark">
                  <Check size={16} />
                </span>

                <p>
                  <small>SELECTED SLOT</small>

                  <b>
                    {selected.id}
                  </b>
                </p>
              </>
            ) : (
              <p>
                <small>SELECT A SLOT</small>

                <b>
                  Choose an available {type.toLowerCase()} space
                </b>
              </p>
            )}
          </div>

          <button onClick={continueBooking}>
            Continue to Booking <ArrowRight size={17} />
          </button>
        </section>
       </section>
    </ParkingShell>
  );
}


export function BookingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [draft] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("parkease-draft-booking")
      );
    } catch {
      return null;
    }
  });

  if (!draft) {
    return (
      <ParkingShell>
        <div className="booking-empty">
          <h1>Start with a parking slot</h1>
          <Link to="/parking">Find Parking</Link>
        </div>
      </ParkingShell>
    );
  }

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      const response = await request("/bookings", {
        method: "POST",
        body: JSON.stringify({
          slotId: draft.slotId,
          vehicleType: draft.vehicleType.toLowerCase(),
          vehicleNumber: draft.vehicle.number,
          startTime: new Date(`${draft.date}T${draft.start}:00`).toISOString(),
          endTime: new Date(`${draft.date}T${draft.end}:00`).toISOString(),
        }),
      });
      sessionStorage.setItem("parkease-confirmed-booking", JSON.stringify(response.booking));
      navigate("/booking/confirmation");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ParkingShell>
      <section className="booking-page">
        <Steps step={4} />

        <div className="booking-confirm-grid">
          <div>
            <span className="eyebrow">Review your booking</span>

            <h1>Almost there.</h1>

            <p>
              Confirm the details for your campus parking reservation.
            </p>

            <div className="booking-details">
              {[
                ["Vehicle", draft.vehicleType],
                ["Vehicle Number", draft.vehicle.number],
                ["Slot", draft.slot.id],
                ["Date", dateLabel(draft.date)],
                [
                  "Time",
                  `${prettyTime(draft.start)} – ${prettyTime(
                    draft.end
                  )}`,
                ],
              ].map(([a, b]) => (
                <div key={a}>
                  <span>{a}</span>
                  <b>{b}</b>
                </div>
              ))}
            </div>
          </div>

          <aside className="booking-summary-card">
            <span className="summary-title">BOOKING SUMMARY</span>

            <div className="summary-slot">
              <span>
                {draft.vehicleType === "Car" ? <Car /> : <Bike />}
              </span>

              <div>
                <b>{draft.slot.id}</b>
              </div>
            </div>

            <p>
              <CalendarDays size={16} />
              {dateLabel(draft.date)}
            </p>

            <p>
              <Clock3 size={16} />
              {prettyTime(draft.start)} – {prettyTime(draft.end)}
            </p>

            <em>Ready to Book</em>

            {error && <p className="parking-error">{error}</p>}
            <button onClick={confirm} disabled={saving}>
              {saving ? "Confirming..." : "Confirm Booking"} <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </section>
    </ParkingShell>
  );
}

export function ConfirmationPage() {
  const booking = useMemo(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("parkease-confirmed-booking"));
      if (!saved) return null;
      return {
        bookingId: saved.bookingId,
        slot: { id: saved.slot?.slotNumber },
        vehicleType: saved.vehicleType === "car" ? "Car" : "Bike",
        vehicle: { number: saved.vehicleNumber },
        date: new Date(saved.startTime).toISOString().slice(0, 10),
        start: new Date(saved.startTime).toTimeString().slice(0, 5),
        end: new Date(saved.endTime).toTimeString().slice(0, 5),
      };
    } catch {
      return getMockBooking();
    }
  }, []);

  return (
    <ParkingShell>
      <section className="confirmation-page">
        {booking ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="confirmation-card"
          >
            <div className="success-circle">
              <Check size={34} />
            </div>

            <span className="eyebrow">Booking complete</span>

            <h1>Booking Confirmed</h1>

            <p>Your parking slot has been reserved.</p>

            <div className="confirmation-info">
              <div>
                <span>Booking ID</span>
                <b>{booking.bookingId}</b>
              </div>

              <div>
                <span>Parking Slot</span>
                <b>
                  {booking.slot.id}
                </b>
              </div>

              <div>
                <span>Vehicle</span>
                <b>
                  {booking.vehicleType} · {booking.vehicle.number}
                </b>
              </div>

              <div>
                <span>Date & Time</span>
                <b>
                  {dateLabel(booking.date)} ·{" "}
                  {prettyTime(booking.start)} –{" "}
                  {prettyTime(booking.end)}
                </b>
              </div>

              <div>
                <span>Status</span>
                <b>Booked</b>
              </div>
            </div>

            <div className="confirmation-actions">
              <Link to="/entry-qr">Scan Entry QR</Link>

              <Link
                to={`/booking/${booking.bookingId}`}
                className="outline"
              >
                View My Booking
              </Link>

              <Link to="/dashboard" className="outline">
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="booking-empty">
            <h1>No booking found</h1>
            <Link to="/parking">Find Parking</Link>
          </div>
        )}
      </section>
    </ParkingShell>
  );
}

export function DashboardPage() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("parkease_token");

        const response = await fetch(
          "http://localhost:5000/api/bookings/my",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success && Array.isArray(data.bookings)) {
          const now = new Date();

          const upcoming = data.bookings
            .filter((item) => {
              const startTime = new Date(item.startTime);

              return (
                ["booked", "active"].includes(item.status) &&
                startTime >= now
              );
            })
            .sort(
              (a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );

          setBooking(upcoming[0] || null);
        }
      } catch (error) {
        console.error("Dashboard booking error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <ParkingShell>
      <section className="dashboard-page">
        <span className="eyebrow">Your campus parking</span>

        <h1>Good morning, Vedika!</h1>

        <p>Here’s a simple view of your parking day.</p>

        <div className="dashboard-stats">
          <article>
            <Car />
            <b>—</b>
            <span>Available Car Slots</span>
          </article>

          <article>
            <Bike />
            <b>—</b>
            <span>Available Bike Slots</span>
          </article>

          <article>
            <Clock3 />
            <b>—</b>
            <span>Active Parking</span>
          </article>
        </div>

        <div className="dashboard-columns">
          <section>
            <h2>Upcoming Booking</h2>

            {loading ? (
              <div className="dashboard-empty">
                <p>Loading booking...</p>
              </div>
            ) : booking ? (
              <article className="upcoming-card">
                <div className="vehicle-round">
                  {booking.vehicleType === "car" ||
                  booking.vehicleType === "Car" ? (
                    <Car />
                  ) : (
                    <Bike />
                  )}
                </div>

                <div>
                  <span className="status-booked">
                    {booking.status === "active"
                      ? "Active"
                      : "Booked"}
                  </span>

                  <h3>
                    {booking.slot?.slotNumber ||
                      booking.slot?.id ||
                      "Parking Slot"}{" "}
                    ·{" "}
                    Campus Parking
                  </h3>

                  <p>
                    {booking.vehicleType} ·{" "}
                    {booking.vehicleNumber ||
                      booking.vehicle?.number ||
                      "Vehicle"}
                  </p>

                  <p>
                    {dateLabel(
                      new Date(booking.startTime)
                        .toISOString()
                        .split("T")[0]
                    )}{" "}
                    ·{" "}
                    {prettyTime(
                      new Date(booking.startTime)
                        .toISOString()
                        .slice(11, 16)
                    )}{" "}
                    –{" "}
                    {prettyTime(
                      new Date(booking.endTime)
                        .toISOString()
                        .slice(11, 16)
                    )}
                  </p>
                </div>

                <button>Cancel Booking</button>
              </article>
            ) : (
              <div className="dashboard-empty">
                <ParkingCircle />

                <p>No upcoming booking yet.</p>

                <Link to="/parking">
                  Find Parking <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2>Quick Actions</h2>

            <Link
              to="/parking"
              className="quick-action"
            >
              <ParkingCircle /> Find Parking <ArrowRight />
            </Link>

            <article className="active-placeholder">
              <Clock3 />

              <div>
                <b>Active Parking</b>

                <p>
                  Your active parking session will appear
                  here.
                </p>
              </div>
            </article>
          </section>
        </div>
      </section>
    </ParkingShell>
  );
}
