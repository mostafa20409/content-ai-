import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // مسح الكوكي الخاص بالتوكن
    (await
      // مسح الكوكي الخاص بالتوكن
      cookies()).set({
      name: "token",
      value: "",
      expires: new Date(0), // منتهي الصلاحية فوراً
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}