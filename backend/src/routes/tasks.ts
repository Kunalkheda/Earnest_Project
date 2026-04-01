import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { validate } from "../middleware/validate";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// All task routes require authentication
router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

// GET /tasks - List tasks with pagination, filtering, search
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = { userId: req.userId };

  if (status && ["pending", "in_progress", "completed"].includes(status)) {
    where.status = status;
  }

  if (search) {
    where.title = { contains: search };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count({ where }),
  ]);

  res.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /tasks - Create a task
router.post(
  "/",
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, status } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "pending",
        userId: req.userId!,
      },
    });

    res.status(201).json(task);
  }
);

// GET /tasks/:id - Get a single task
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

// PATCH /tasks/:id - Update a task
router.patch(
  "/:id",
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  }
);

// DELETE /tasks/:id - Delete a task
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: "Task deleted successfully" });
  }
);

// PATCH /tasks/:id/toggle - Toggle task status
router.patch(
  "/:id/toggle",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const newStatus = task.status === "completed" ? "pending" : "completed";

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json(updated);
  }
);

export default router;
