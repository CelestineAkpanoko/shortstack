import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();

    // Only allow authenticated teachers
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // If no query is provided, maybe return all classes or an empty array
    if (!query) {
      const allClasses = await db.class.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(allClasses);
      // Alternatively, return empty array: return NextResponse.json([]);
    }

    const lowerCaseQuery = query.toLowerCase();

    // Perform the search across relevant fields
    const searchResults = await db.class.findMany({
      where: {
        userId: session.user.id, // Ensure only the teacher's classes are searched
        OR: [
          {
            name: {
              contains: lowerCaseQuery,
              mode: 'insensitive', // Case-insensitive search
            },
          },
          {
            code: {
              contains: lowerCaseQuery,
              mode: 'insensitive',
            },
          },
          {
            grade: {
              contains: lowerCaseQuery,
              mode: 'insensitive',
            },
          },
          // Add other fields to search if needed, e.g., description
          // { overview: { contains: lowerCaseQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Or order by relevance, e.g., name match first
      },
      // Add select or include if you need related data
      // include: { user: { select: { name: true } } }
    });

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
