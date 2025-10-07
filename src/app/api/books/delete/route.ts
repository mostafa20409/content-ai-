// src/app/api/books/delete/route.ts
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    new URL(request.url)
    
    // منطق حذف الكتاب
    return NextResponse.json({ message: 'Book deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}