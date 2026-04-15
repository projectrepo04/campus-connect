import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/db";

const DEPARTMENTS = [
    { id: "computer", name: "Computer Engineering", code: "CO" },
    { id: "electrical", name: "Electrical Engineering", code: "EE" },
    { id: "entc", name: "Electronics & Telecommunication", code: "ENTC" },
    { id: "civil", name: "Civil Engineering", code: "CE" },
    { id: "mechanical", name: "Mechanical Engineering", code: "ME" },
];

export const getDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json({ departments: DEPARTMENTS });
};
