import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../prisma";
import { validate } from "../middleware/validate";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// POST /auth/register
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  }
);

// POST /auth/login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  }
);

// POST /auth/refresh
router.post(
  "/refresh",
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  }
);

// POST /auth/logout
router.post(
  "/logout",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    await prisma.user.update({
      where: { id: req.userId },
      data: { refreshToken: null },
    });

    res.json({ message: "Logged out successfully" });
  }
);

export default router;
