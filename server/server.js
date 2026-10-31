import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "dev-secret",
  HASH = bcrypt.hashSync(process.env.ADMIN_PASS || "admin123", 10);
const app = express(),
  db = new Database("shop.db");

fs.mkdirSync("uploads", { recursive: true });
db.exec(`CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,name TEXT,description TEXT,price REAL,category TEXT,stock INT DEFAULT 0,image TEXT,featured INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,name TEXT,email TEXT,phone TEXT,address TEXT,items TEXT,total REAL,status TEXT DEFAULT 'Pending',created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT);`);

const defs = {
  banner: "Complimentary worldwide shipping on all orders",
  about_title: "Time, Crafted.",
  about_text:
    "Every S’WATCH timepiece is assembled by hand from sapphire crystal, surgical steel and precious metals.",
  email: "hello@swatch.com",
  phone: "+1 000 000 0000",
  address: "1 Watchmaker Lane",
  social: "https://instagram.com",
};
for (const [k, v] of Object.entries(defs))
  db.prepare("INSERT OR IGNORE INTO settings VALUES(?,?)").run(k, v);

if (!db.prepare("SELECT COUNT(*) c FROM products").get().c) {
  const i = db.prepare(
    "INSERT INTO products(name,description,price,category,stock,featured) VALUES(?,?,?,?,?,?)",
  );
  [
    [
      "Fossil Gen 5",
      "Gold-tone automatic with diamond markers.",
      359,
      "Gold",
      8,
      1,
    ],
    ["Noir Chrono", "Deep black chronograph.", 480, "Black", 5, 1],
    [
      "Aurum Classic",
      "Champagne dial, two-tone bracelet.",
      620,
      "Classic",
      3,
      1,
    ],
  ].forEach((r) => i.run(...r));
}

// ✅ NAYA CODE YAHAN ADD HUA HAI (3 Naye Watches)
const addP = db.prepare(
  "INSERT INTO products(name,description,price,category,stock,featured,image) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM products WHERE name=?)",
);
[
  [
    "Steel Noir",
    "Polished steel case with a black sunburst dial.",
    540,
    "Steel",
    6,
    0,
    "/watches/steel-noir.jpg",
  ],
  [
    "Rosé Slim",
    "Rose-gold case, cream dial and a tan leather strap.",
    590,
    "Classic",
    4,
    0,
    "/watches/rose-cream.jpg",
  ],
  [
    "Deep Blue Diver",
    "Blue bezel and dial on a steel bracelet, built for the water.",
    680,
    "Diver",
    5,
    0,
    "/watches/diver-blue.jpg",
  ],
].forEach((r) => addP.run(...r, r[0]));

// ✅ NAYA CODE KHATAM

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("uploads"));

const up = multer({
  storage: multer.diskStorage({
    destination: "uploads",
    filename: (q, f, cb) =>
      cb(null, Date.now() + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5e6 },
  fileFilter: (q, f, cb) =>
    cb(null, /^image\/(jpeg|png|webp|avif)$/.test(f.mimetype)),
});

const auth = (q, s, n) => {
  try {
    jwt.verify((q.headers.authorization || "").slice(7), SECRET);
    n();
  } catch {
    s.status(401).json({ error: "Unauthorized" });
  }
};

const tries = {};
app.post("/api/admin/login", (q, s) => {
  const t = (tries[q.ip] = (tries[q.ip] || 0) + 1);
  setTimeout(() => delete tries[q.ip], 9e5);
  if (t > 8) return s.status(429).json({ error: "Too many attempts" });
  const { username, password } = q.body;
  if (
    username === (process.env.ADMIN_USER || "admin") &&
    bcrypt.compareSync(password || "", HASH)
  )
    return s.json({ token: jwt.sign({ a: 1 }, SECRET, { expiresIn: "8h" }) });
  s.status(401).json({ error: "Invalid credentials" });
});

app.get("/api/products", (q, s) =>
  s.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()),
);

app.get("/api/products/:id", (q, s) => {
  const p = db.prepare("SELECT * FROM products WHERE id=?").get(q.params.id);
  p ? s.json(p) : s.status(404).json({ error: "Not found" });
});

app.get("/api/settings", (q, s) =>
  s.json(
    Object.fromEntries(
      db
        .prepare("SELECT * FROM settings")
        .all()
        .map((r) => [r.k, r.v]),
    ),
  ),
);

app.post("/api/orders", (q, s) => {
  const { name, email, phone, address, items } = q.body;
  if (
    !name ||
    !/\S+@\S+/.test(email || "") ||
    !address ||
    !Array.isArray(items) ||
    !items.length
  )
    return s.status(400).json({ error: "Invalid order" });
  try {
    const id = db.transaction(() => {
      let total = 0;
      const lines = items.map(({ id, qty }) => {
        const p = db.prepare("SELECT * FROM products WHERE id=?").get(id);
        qty = Math.floor(+qty);
        if (!p || qty < 1 || p.stock < qty)
          throw new Error((p?.name || "Item") + " unavailable");
        db.prepare("UPDATE products SET stock=stock-? WHERE id=?").run(qty, id);
        total += p.price * qty;
        return { id, name: p.name, price: p.price, qty };
      });
      return db
        .prepare(
          "INSERT INTO orders(name,email,phone,address,items,total) VALUES(?,?,?,?,?,?)",
        )
        .run(name, email, phone || "", address, JSON.stringify(lines), total)
        .lastInsertRowid;
    })();
    s.json({ id });
  } catch (e) {
    s.status(400).json({ error: e.message });
  }
});

const A = express.Router();
A.use(auth);

const vals = (b) => [
  b.name,
  b.description,
  +b.price || 0,
  b.category,
  +b.stock || 0,
  b.featured === "1" ? 1 : 0,
];

A.post("/products", up.single("image"), (q, s) =>
  s.json({
    id: db
      .prepare(
        "INSERT INTO products(name,description,price,category,stock,featured,image) VALUES(?,?,?,?,?,?,?)",
      )
      .run(...vals(q.body), q.file ? "/uploads/" + q.file.filename : null)
      .lastInsertRowid,
  }),
);

A.put("/products/:id", up.single("image"), (q, s) => {
  db.prepare(
    "UPDATE products SET name=?,description=?,price=?,category=?,stock=?,featured=?,image=COALESCE(?,image) WHERE id=?",
  ).run(
    ...vals(q.body),
    q.file ? "/uploads/" + q.file.filename : null,
    q.params.id,
  );
  s.json({ ok: 1 });
});

A.delete("/products/:id", (q, s) => {
  db.prepare("DELETE FROM products WHERE id=?").run(q.params.id);
  s.json({ ok: 1 });
});

A.get("/orders", (q, s) =>
  s.json(
    db
      .prepare("SELECT * FROM orders ORDER BY id DESC")
      .all()
      .map((o) => ({ ...o, items: JSON.parse(o.items) })),
  ),
);

A.put("/orders/:id", (q, s) => {
  if (
    !["Pending", "Paid", "Shipped", "Delivered", "Cancelled"].includes(
      q.body.status,
    )
  )
    return s.status(400).json({ error: "Bad status" });
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(
    q.body.status,
    q.params.id,
  );
  s.json({ ok: 1 });
});

A.get("/stats", (q, s) =>
  s.json({
    products: db.prepare("SELECT COUNT(*) c FROM products").get().c,
    lowStock: db.prepare("SELECT COUNT(*) c FROM products WHERE stock<3").get()
      .c,
    orders: db.prepare("SELECT COUNT(*) c FROM orders").get().c,
    pending: db
      .prepare("SELECT COUNT(*) c FROM orders WHERE status='Pending'")
      .get().c,
    revenue: db
      .prepare(
        "SELECT COALESCE(SUM(total),0) t FROM orders WHERE status!='Cancelled'",
      )
      .get().t,
  }),
);

A.put("/settings", (q, s) => {
  for (const k of Object.keys(defs))
    if (k in q.body)
      db.prepare("INSERT OR REPLACE INTO settings VALUES(?,?)").run(
        k,
        String(q.body[k]),
      );
  s.json({ ok: 1 });
});

app.use("/api/admin", A);

app.listen(process.env.PORT || 5000, () =>
  console.log("API on :" + (process.env.PORT || 5000)),
);