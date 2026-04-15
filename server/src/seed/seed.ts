import { prisma } from "../config/db";
import bcrypt from "bcrypt";

const DEPARTMENTS = [
    { name: "Computer Science & Engineering", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Mechanical Engineering", code: "ME" },
    { name: "Civil Engineering", code: "CE" },
    { name: "Information Technology", code: "IT" },
];

const USERS = [
    { email: "campus.admin@gmail.com", password: "Admin@123", fullName: "Dr. Rajesh Kumar", role: "admin", departmentCode: "CSE", isApproved: "approved", isVerified: true },
    { email: "student.user@gmail.com", password: "Student@123", fullName: "Ayesha Sharma", role: "student", departmentCode: "CSE", rollNumber: "CS22CS001", semester: 4, isApproved: "approved", isVerified: true },
    { email: "faculty.prof@gmail.com", password: "Faculty@123", fullName: "Prof. Meena Iyer", role: "faculty", departmentCode: "CSE", designation: "Associate Professor", isApproved: "approved", isVerified: true },
    { email: "alumni.grad@gmail.com", password: "Alumni@123", fullName: "Vikram Patel", role: "alumni", departmentCode: "CSE", passingYear: 2022, isApproved: "approved", isVerified: true },
];

async function seed() {
    console.log(" Seeding...\n");
    
    for (const d of DEPARTMENTS) {
        const existing = await prisma.department.findFirst({ where: { code: d.code } });
        if (!existing) {
            await prisma.department.create({ data: { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
            console.log(` ${d.name}`);
        }
    }
    
    for (const u of USERS) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (!existing) {
            const hashed = await bcrypt.hash(u.password, 10);
            await prisma.user.create({ data: { uid: crypto.randomUUID(), email: u.email, password: hashed, fullName: u.fullName, role: u.role, departmentCode: u.departmentCode, isApproved: u.isApproved, isVerified: u.isVerified, isCampusMember: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
            console.log(` ${u.fullName} (${u.role})`);
        }
    }
    
    console.log("\n Done!");
    console.log("Admin: campus.admin@gmail.com / Admin@123");
    console.log("Student: student.user@gmail.com / Student@123");
    console.log("Faculty: faculty.prof@gmail.com / Faculty@123");
    console.log("Alumni: alumni.grad@gmail.com / Alumni@123");
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
