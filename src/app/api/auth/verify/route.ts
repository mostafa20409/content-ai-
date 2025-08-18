import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectToDB from "../../../../lib/connectToDB";
import User from "../../../../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; // يفضل تحطها في env

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // فك التوكن والتحقق
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // الاتصال بقاعدة البيانات
    await connectToDB();

    // البحث عن المستخدم
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
