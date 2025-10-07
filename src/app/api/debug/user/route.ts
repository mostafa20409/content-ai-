// app/api/debug/users/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDB();
    
    const users = await User.find({}).select("email name active password").lean();
    
    // إرجاع بيانات المستخدمين بدون كلمات المرور للأمان
    const usersSafe = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      active: user.active,
      hasPassword: !!user.password,
      passwordType: user.password ? (user.password.startsWith('$2') ? 'bcrypt' : 'plain') : 'none'
    }));
    
    return NextResponse.json({
      success: true,
      users: usersSafe,
      total: usersSafe.length
    });
    
  } catch (error) {
    console.error("Debug users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}