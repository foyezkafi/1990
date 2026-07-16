import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Product, Order, OrderStatus, Notification, TimelineEvent } from "./src/types";

const app = express();
const PORT = 3000;

// Increase payload limit for base64 screenshot uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_DIR = path.join(process.cwd(), "server-data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Helper to ensure database is initialized with premium products
function initDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const initialProducts: Product[] = [
    {
      id: "prod-1",
      name: "Premium Oversized Cotton Hoodie",
      description: "Crafted from 450GSM heavy cotton. Drop shoulder silhouette, double-lined hood, and deep kangaroo pocket. Built for absolute comfort and a sleek structural drape.",
      price: 1950,
      originalPrice: 2500,
      category: "Streetwear",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Charcoal Slate", hex: "#334155" },
        { name: "Midnight Black", hex: "#0f172a" },
        { name: "Olive Green", hex: "#3f6212" }
      ],
      rating: 4.8,
      reviewsCount: 128,
      stock: 25,
      isFeatured: true
    },
    {
      id: "prod-2",
      name: "Classic Italian Wool Blend Coat",
      description: "Tailored double-breasted long coat in a rich wool blend. Features hand-stitched notch lapels, structural shoulders, and deep inner lining for crisp, cold seasons.",
      price: 4500,
      originalPrice: 5800,
      category: "Womenswear",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
      sizes: ["XS", "S", "M", "L"],
      colors: [
        { name: "Camel Tan", hex: "#b45309" },
        { name: "Charcoal Slate", hex: "#334155" }
      ],
      rating: 4.9,
      reviewsCount: 64,
      stock: 8,
      isFeatured: true
    },
    {
      id: "prod-3",
      name: "Tactical Streetwise Cargo Pants",
      description: "Multi-pocket industrial cargo trousers featuring quick-release buckles, elasticated waist cords, and water-resistant nylon blend weave.",
      price: 2200,
      category: "Streetwear",
      image: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=600",
      sizes: ["M", "L", "XL"],
      colors: [
        { name: "Midnight Black", hex: "#0f172a" },
        { name: "Olive Green", hex: "#3f6212" }
      ],
      rating: 4.5,
      reviewsCount: 92,
      stock: 18
    },
    {
      id: "prod-4",
      name: "Organic Crewneck Minimalist Tee",
      description: "Super-soft organic combed cotton jersey tee. Features neck ribbing and shoulder-to-shoulder tape. Pre-shrunk to retain structural fit after endless washes.",
      price: 850,
      originalPrice: 1200,
      category: "Menswear",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [
        { name: "Eggshell White", hex: "#fafaf9" },
        { name: "Heather Grey", hex: "#64748b" },
        { name: "Midnight Black", hex: "#0f172a" }
      ],
      rating: 4.7,
      reviewsCount: 310,
      stock: 50,
      isFeatured: true
    },
];

  if (!fs.existsSync(DB_FILE)) {
    const productsWithCodes = initialProducts.map((p, index) => ({
      ...p,
      code: String(index + 1).padStart(3, "0")
    }));
    const defaultData = {
      products: productsWithCodes,
      orders: [] as Order[],
      notifications: [] as Notification[],
      stats: {
        totalRevenue: 0,
        totalOrders: 0
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    console.log("Database seeded successfully inside server-data/db.json");
  }
}

// Helper to read DB state
function readDB() {
  initDB();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

// Helper to write DB state
function writeDB(data: any) {
  initDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

initDB();

// --- REST API ENDPOINTS ---

// 1. Products API
app.get("/api/products", (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.get("/api/products/:id", (req, res) => {
  const db = readDB();
  const prod = db.products.find((p: Product) => p.id === req.params.id);
  if (!prod) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(prod);
});

// Admin can add a new product
app.post("/api/products", (req, res) => {
  const db = readDB();
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || "No description provided.",
    price: Number(req.body.price),
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
    category: req.body.category || "General",
    image: req.body.image || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
    sizes: req.body.sizes || ["M"],
    colors: req.body.colors || [{ name: "Black", hex: "#000000" }],
    rating: 5.0,
    reviewsCount: 0,
    stock: Number(req.body.stock) || 10
  };

  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

// 2. Orders API (Checkout flow & Management)

// POST /api/orders - Initiate order & checkout
app.post("/api/orders", (req, res) => {
  const db = readDB();
  const { customerName, phone, email, shippingAddress, notes, items, totalAmount } = req.body;

  if (!customerName || !phone || !email || !shippingAddress || !items || items.length === 0) {
    res.status(400).json({ error: "Missing required checkout parameters." });
    return;
  }

  // Generate Unique Order ID: ORDER-YYYYMMDD-XXXX
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // Find sequence for today
  const todaysOrders = db.orders.filter((o: Order) => o.id.includes(`ORDER-${dateStr}`));
  const sequenceNumber = String(todaysOrders.length + 1).padStart(4, "0");
  const orderId = `ORDER-${dateStr}-${sequenceNumber}`;

  const initialTimeline: TimelineEvent[] = [
    {
      status: "Pending Payment",
      timestamp: new Date().toISOString(),
      note: "Order placed. Awaiting manual payment transfer."
    }
  ];

  const newOrder: Order = {
    id: orderId,
    customerName,
    phone,
    email,
    shippingAddress,
    notes,
    items,
    totalAmount,
    paymentMethod: "bKash", // default placeholder, update on submit payment
    transactionId: "",
    status: "Pending Payment",
    statusTimeline: initialTimeline,
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  writeDB(db);

  res.status(201).json(newOrder);
});

// POST /api/orders/:id/payment - Submit Manual Payment Details
app.post("/api/orders/:id/payment", (req, res) => {
  const db = readDB();
  const { paymentMethod, transactionId, screenshot } = req.body;
  const orderIndex = db.orders.findIndex((o: Order) => o.id === req.params.id);

  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (!paymentMethod || !transactionId) {
    res.status(400).json({ error: "Payment method and Transaction ID are required." });
    return;
  }

  const order = db.orders[orderIndex];
  order.paymentMethod = paymentMethod;
  order.transactionId = transactionId;
  if (screenshot) {
    order.screenshot = screenshot;
  }

  // Append payment details submission to timeline
  order.statusTimeline.push({
    status: "Pending Payment",
    timestamp: new Date().toISOString(),
    note: `Submitted manual payment of ৳${order.totalAmount} via ${paymentMethod}. Transaction ID: ${transactionId}. Awaiting admin verification.`
  });

  // Create an admin notification
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    orderId: order.id,
    title: "New Payment Submitted",
    message: `Customer ${order.customerName} submitted payment of ৳${order.totalAmount} for order ${order.id}. Txn ID: ${transactionId}`,
    status: "unread",
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  db.orders[orderIndex] = order;
  writeDB(db);

  res.json({ success: true, order });
});

// POST /api/orders/:id/status - Admin status update (approve, ship, deliver, reject)
app.post("/api/orders/:id/status", (req, res) => {
  const db = readDB();
  const { status, note } = req.body;
  const orderIndex = db.orders.findIndex((o: Order) => o.id === req.params.id);

  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const allowedStatuses: OrderStatus[] = [
    "Pending Payment",
    "Payment Verified",
    "Processing",
    "Shipped",
    "Delivered",
    "Rejected",
    "Cancelled"
  ];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid order status. Allowed: ${allowedStatuses.join(", ")}` });
    return;
  }

  const order = db.orders[orderIndex];
  const oldStatus = order.status;
  order.status = status;

  const defaultNote = {
    "Payment Verified": "Payment successfully verified by Admin.",
    "Processing": "Order has been moved to processing.",
    "Shipped": "Order handed over to delivery partner. Courier tracking details updated.",
    "Delivered": "Order successfully delivered to customer.",
    "Rejected": "Payment rejected by Admin. Please double check Transaction ID or contact support.",
    "Cancelled": "Order has been cancelled."
  }[status] || `Order status updated to ${status}.`;

  // Append to timeline
  order.statusTimeline.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || defaultNote
  });

  // Create notifications for customer
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    orderId: order.id,
    title: `Order Status: ${status}`,
    message: `Your order ${order.id} status has been updated from '${oldStatus}' to '${status}'.`,
    status: "unread",
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  // Ready Email architecture hook (simulated)
  console.log(`[Email System] Sending confirmation email to ${order.email}: Subject: "Order ${order.id} is now ${status}"`);

  db.orders[orderIndex] = order;
  writeDB(db);

  res.json({ success: true, order });
});

// GET /api/orders - Admin retrieves all orders
app.get("/api/orders", (req, res) => {
  const db = readDB();
  let orders = db.orders;

  // Filter and search
  const { status, search } = req.query;
  if (status) {
    orders = orders.filter((o: Order) => o.status === status);
  }
  if (search) {
    const s = String(search).toLowerCase();
    orders = orders.filter((o: Order) =>
      o.id.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.phone.includes(s) ||
      o.transactionId.toLowerCase().includes(s)
    );
  }

  // Return newest first
  orders = [...orders].reverse();
  res.json(orders);
});

// GET /api/orders/:id - Customer tracks their single order
app.get("/api/orders/:id", (req, res) => {
  const db = readDB();
  const order = db.orders.find((o: Order) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

// 3. Notifications API
app.get("/api/notifications", (req, res) => {
  const db = readDB();
  res.json(db.notifications || []);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const db = readDB();
  const index = db.notifications.findIndex((n: Notification) => n.id === req.params.id);
  if (index !== -1) {
    db.notifications[index].status = "read";
    writeDB(db);
  }
  res.json({ success: true });
});

// 4. Admin statistics summary API
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const orders = db.orders || [];

  const verifiedOrders = orders.filter((o: Order) =>
    ["Payment Verified", "Processing", "Shipped", "Delivered"].includes(o.status)
  );
  const totalRevenue = verifiedOrders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o: Order) => o.status === "Pending Payment").length;
  const processingCount = orders.filter((o: Order) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o: Order) => o.status === "Delivered").length;

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    pendingCount,
    processingCount,
    deliveredCount
  });
});

// --- PLATFORM INTEGRATION VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
