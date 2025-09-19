// app/api/health/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDB";

export async function GET() {
  try {
    await connectToDB();
    return NextResponse.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'Error', 
      database: 'disconnected',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}