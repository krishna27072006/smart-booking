const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const pool = require("./db");
const path = require("path");

const app = express();

app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE", allowedHeaders: "Content-Type" }));
app.use(express.json());

/* =====================================================
    REGISTER – CLIENT
===================================================== */
app.post("/api/register-client", async (req, res) => {
  const { name, email, phone, city, password } = req.body;
  if (!name || !email || !phone || !city || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(name,email,phone,city,password,role)
       VALUES($1,$2,$3,$4,$5,'client')
       RETURNING id,name,email,city,role`,
      [name, email, phone, city, hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER CLIENT ERROR:", err);
    res.status(500).json({ error: "Server error (client signup)" });
  }
});

/* =====================================================
    REGISTER – ADMIN
===================================================== */
app.post("/api/register-admin", async (req, res) => {
  const { provider_name, name, email, phone, city, map_url, password } = req.body;

  if (!provider_name || !name || !email || !phone || !city || !password)
    return res.status(400).json({ error: "All required fields missing" });

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(provider_name,name,email,phone,city,map_url,password,role)
       VALUES($1,$2,$3,$4,$5,$6,$7,'admin')
       RETURNING id,provider_name,name,email,city,map_url,role`,
      [provider_name, name, email, phone, city, map_url, hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER ADMIN ERROR:", err);
    res.status(500).json({ error: "Server error (admin signup)" });
  }
});

/* =====================================================
    LOGIN
===================================================== */
app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ error: "All fields required" });

  try {
    console.log("LOGIN HIT:", email, role);

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (!result.rows.length)
      return res.status(401).json({ error: "Invalid email" });

    const user = result.rows[0];

    if (!user.password) {
      console.error("Password missing in DB for user:", user);
      return res.status(500).json({ error: "User data corrupted" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: "Wrong password" });

    if (user.role !== role)
      return res.status(403).json({ error: `Login as ${user.role}` });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      provider_name: user.provider_name,
      map_url: user.map_url
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =====================================================
    ADMIN – ADD SERVICE
===================================================== */
app.post("/api/admin/services", async (req, res) => {
  const { service_name, price, admin_id } = req.body;

  if (!service_name || !price || !admin_id)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const result = await pool.query(
      `INSERT INTO services(service_name,price,admin_id)
       VALUES($1,$2,$3) RETURNING id,service_name,price`,
      [service_name, price, admin_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD SERVICE ERROR:", err);
    res.status(500).json({ error: "Add service failed" });
  }
});

/* =====================================================
    ADMIN – LOAD SERVICES
===================================================== */
app.get("/api/admin/services", async (req, res) => {
  const { admin_id } = req.query;

  if (!admin_id)
    return res.status(400).json({ error: "admin_id required" });

  try {
    const result = await pool.query(
      `SELECT id,service_name,price FROM services WHERE admin_id=$1 ORDER BY id DESC`,
      [admin_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("LOAD SERVICES ERROR:", err);
    res.status(500).json({ error: "Fetch services failed" });
  }
});

/* =====================================================
    PUBLIC – SERVICES BY CITY
===================================================== */
app.get("/api/services", async (req, res) => {
  const { city } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        s.id, s.service_name, s.price, s.admin_id,
        u.provider_name, u.city, u.map_url,
        COALESCE(AVG(r.rating),0) AS avg_rating,
        COUNT(r.id) AS rating_count
       FROM services s
       JOIN users u ON u.id = s.admin_id
       LEFT JOIN bookings b ON b.service_id = s.id
       LEFT JOIN ratings r ON r.booking_id = b.id
       WHERE ($1 = '' OR u.city = $1)
       GROUP BY s.id, u.provider_name, u.city, u.map_url, s.price, s.service_name, s.admin_id
       ORDER BY s.id DESC`,
      [city || ""]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("PUBLIC SERVICES ERROR:", err);
    res.status(500).json({ error: "Fetch public services failed" });
  }
});

/* =====================================================
    ADMIN – ADD SLOT
===================================================== */
app.post("/api/admin/slots", async (req, res) => {
  const { service_id, slot_date, start_time, end_time } = req.body;

  if (!service_id || !slot_date || !start_time || !end_time)
    return res.status(400).json({ error: "Missing fields" });

  try {
    await pool.query(
      `INSERT INTO time_slots(service_id,slot_date,start_time,end_time)
       VALUES($1,$2,$3,$4)`,
      [service_id, slot_date, start_time, end_time]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ADD SLOT ERROR:", err);
    res.status(500).json({ error: "Slot add failed" });
  }
});

/* =====================================================
    CLIENT – AVAILABLE SLOTS
===================================================== */
app.get("/api/time-slots", async (req, res) => {
  const { service_id, date } = req.query;

  if (!service_id || !date)
    return res.status(400).json({ error: "service_id & date required" });

  try {
    const result = await pool.query(
      `SELECT id,start_time,end_time 
       FROM time_slots
       WHERE service_id=$1 AND slot_date=$2 AND is_booked=false
       ORDER BY start_time`,
      [service_id, date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH SLOTS ERROR:", err);
    res.status(500).json({ error: "Fetch slots failed" });
  }
});

/* =====================================================
    BOOKING
===================================================== */
app.post("/api/bookings", async (req, res) => {
  const { name, email, service_id, booking_date, slot_id, booked_by } = req.body;

  if (!name || !email || !service_id || !booking_date || !slot_id || !booked_by)
    return res.status(400).json({ error: "Missing fields" });

  try {
    let userLookup = await pool.query("SELECT id FROM users WHERE email=$1", [email]);

    let user_id = userLookup.rows.length
      ? userLookup.rows[0].id
      : (await pool.query(
          "INSERT INTO users(name,email) VALUES($1,$2) RETURNING id",
          [name, email]
        )).rows[0].id;

    const slot = await pool.query(
      "SELECT start_time,end_time FROM time_slots WHERE id=$1 AND is_booked=false",
      [slot_id]
    );

    if (!slot.rows.length)
      return res.status(400).json({ error: "Slot already booked" });

    const time = slot.rows[0].start_time + "-" + slot.rows[0].end_time;

    const result = await pool.query(
      `INSERT INTO bookings(user_id,service_id,booking_date,time_slot,status,is_rated,appointment_email,booked_by)
       VALUES($1,$2,$3,$4,'pending',false,$5,$6) RETURNING *`,
      [user_id, service_id, booking_date, time, email, booked_by]
    );

    await pool.query("UPDATE time_slots SET is_booked=true WHERE id=$1", [slot_id]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

/* =====================================================
    GLOBAL ERROR HANDLERS
===================================================== */
process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED REJECTION:", err);
});

/* =====================================================
    STATIC + SERVER START
===================================================== */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend 🚀 running on port ${PORT}`);
});