// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type User = {
  id: number;
  name: string;
  email: string;
  password: string; // hashed password
};

let users: User[] = [];
let idCounter = 1;

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // التحقق من الإدخالات
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields (name, email, password) are required." },
        { status: 400 }
      );
    }

    // تحقق من email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // تحقق من طول الباسورد
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // تأكد أن الإيميل مش موجود
    if (users.find((u) => u.email === email)) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 400 }
      );
    }

    // Hash للباسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // إضافة المستخدم
    const newUser: User = {
      id: idCounter++,
      name,
      email,
      password: hashedPassword,
    };

    users.push(newUser);

    return NextResponse.json(
      {
        message: "User registered successfully!",
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}