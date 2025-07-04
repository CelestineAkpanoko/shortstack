import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Get a specific todo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the appropriate teacherId based on user role
    let teacherId = session.user.id;
    
    if (session.user.role === 'TEACHER') {
      const teacher = await db.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }
      
      teacherId = teacher.id;
    } else if (session.user.role === 'STUDENT') {
      const student = await db.student.findFirst({
        where: { 
          OR: [
            { userId: session.user.id },
            ...(session.user.email ? [{ schoolEmail: session.user.email }] : [])
          ]
        },
        select: { teacherId: true }
      });
      
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      teacherId = student.teacherId;
    }

    const todo = await db.todo.findUnique({
      where: {
        id: id,
        teacherId: teacherId
      },
      include: {
        calendarEvent: true
      }
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Error fetching todo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update a todo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const { title, description, completed, dueDate, priority, calendarEventId } = data;

    // Get the appropriate teacherId based on user role
    let teacherId = session.user.id;
    
    if (session.user.role === 'TEACHER') {
      const teacher = await db.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }
      
      teacherId = teacher.id;
    } else if (session.user.role === 'STUDENT') {
      const student = await db.student.findFirst({
        where: { 
          OR: [
            { userId: session.user.id },
            ...(session.user.email ? [{ schoolEmail: session.user.email }] : [])
          ]
        },
        select: { teacherId: true }
      });
      
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      teacherId = student.teacherId;
    }

    const existingTodo = await db.todo.findUnique({
      where: {
        id: id,
        teacherId: teacherId
      },
      include: {
        calendarEvent: true
      }
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Create a type-safe update data object
    const updateData: Prisma.TodoUpdateInput = {};
    
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (calendarEventId !== undefined) updateData.calendarEvent = { connect: { id: calendarEventId } };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
    }
    
    const updatedTodo = await db.todo.update({
      where: { id },
      data: updateData,
      include: {
        calendarEvent: true
      }
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete a todo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the appropriate teacherId based on user role
    let teacherId = session.user.id;
    
    if (session.user.role === 'TEACHER') {
      const teacher = await db.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }
      
      teacherId = teacher.id;
    } else if (session.user.role === 'STUDENT') {
      const student = await db.student.findFirst({
        where: { 
          OR: [
            { userId: session.user.id },
            ...(session.user.email ? [{ schoolEmail: session.user.email }] : [])
          ]
        },
        select: { teacherId: true }
      });
      
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      teacherId = student.teacherId;
    }

    const existingTodo = await db.todo.findUnique({
      where: {
        id: id,
        teacherId: teacherId
      },
      select: {
        id: true,
        calendarEventId: true,
        teacherId: true
      }
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.todo.delete({
        where: { id: id }
      });

      if (existingTodo.calendarEventId) {
        await tx.calendarEvent.delete({
          where: { id: existingTodo.calendarEventId }
        });
      }
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}