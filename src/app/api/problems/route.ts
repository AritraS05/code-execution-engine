import { getProblems } from '@/app/utils/getProblems';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(getProblems());
}
