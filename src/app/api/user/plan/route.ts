import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/lib/connectToDB";
import User from "@/models/User";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await connectToDB();

    const user = await User.findById(decoded.id).select("subscription subscriptionLimits");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscription: user.subscription,
      limits: user.subscriptionLimits
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get user plan" },
      { status: 500 }
    );
  }
}