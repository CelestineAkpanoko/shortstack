import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find student
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id }
        ]
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }
    
    // Get student's enrollments to find their classes
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        enrolled: true
      }
    });
    
    const classIds = enrollments.map(e => e.classId);
    
    if (classIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get bills directly from the classes the student is enrolled in
    const bills = await db.bill.findMany({
      where: {
        class: {
          some: {
            id: { in: classIds }
          }
        },
        status: "ACTIVE" 
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            emoji: true,
            code: true
          }
        },
        // Include any existing student bill records
        studentBills: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    // Format bills for the frontend - exclude fully paid bills
    const formattedBills = bills
      .map(bill => {
        // Get this student's payment record if it exists
        const studentBill = bill.studentBills && bill.studentBills[0];
        const paidAmount = studentBill?.paidAmount || 0;
        
        // Skip bills that are fully paid
        if (studentBill?.isPaid || paidAmount >= bill.amount) {
          return null;
        }
        
        return {
          id: studentBill?.id || `bill_${bill.id}`, // Use existing studentBill id if available
          billId: bill.id,
          studentId: student.id,
          title: bill.title,
          amount: bill.amount,
          paidAmount: paidAmount, // Use actual paid amount
          dueDate: bill.dueDate,
          description: bill.description || "",
          classId: bill.class[0]?.id || "",
          className: bill.class[0]?.name || "Unknown class",
          emoji: bill.class[0]?.emoji || "📝"
        };
      })
      .filter(Boolean); // Remove nulls (fully paid bills)
    
    return NextResponse.json(formattedBills);
    
  } catch (error) {
    console.error("Error fetching student bills:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}