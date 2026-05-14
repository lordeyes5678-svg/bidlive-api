import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../lib/db.js";
import { usersTable } from "../schema/users.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    });

  res.status(201).json({ token: signToken(user.id), user });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  res.json({
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  let payload: { sub: number };
  try {
    payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub: number };
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
