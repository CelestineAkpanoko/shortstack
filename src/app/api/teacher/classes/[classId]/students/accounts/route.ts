import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function GET(
  req: Request,
  context: { params: Promise<{ classId: string }> } 
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await context.params; 

    // Verify teacher owns the class
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        userId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 403 });
    }

    // Get all students enrolled in the class with their bank accounts
    const students = await db.student.findMany({
      where: {
        enrollments: {
          some: {
            classId,
            enrolled: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        schoolEmail: true,
        userId: true,
        bankAccounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
          },
        },
      },
    });

    // Get last login information from User model for each student that has a userId
    const studentIds = students.map(student => student.userId).filter(Boolean);
    
    const userLoginInfo = studentIds.length > 0 
      ? await db.user.findMany({
          where: { 
            id: { in: studentIds as string[] }
          },
          select: {
            id: true,
            createdAt: true // Use createdAt instead of lastLogin
          }
        })
      : [];

    // Create a map of userId -> createdAt for quick lookup
    const userLoginMap = Object.fromEntries(
      userLoginInfo.map(user => [user.id, user.createdAt]) // Fix the user.lastLogin access
    );

    // Format the student data for the frontend
    const formattedStudents = students.map((student) => {
      const checkingAccount = student.bankAccounts.find(
        (acc) => acc.accountType === "CHECKING"
      ) || { id: "", accountNumber: "", balance: 0 };
      
      const savingsAccount = student.bankAccounts.find(
        (acc) => acc.accountType === "SAVINGS"
      ) || { id: "", accountNumber: "", balance: 0 };

      const lastLogin = student.userId && userLoginMap[student.userId]
        ? new Date(userLoginMap[student.userId]).toLocaleDateString()
        : "Never";

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.schoolEmail,
        lastLogin,
        checking: {
          id: checkingAccount.id,
          accountNumber: checkingAccount.accountNumber || "",
          balance: checkingAccount.balance || 0,
        },
        savings: {
          id: savingsAccount.id,
          accountNumber: savingsAccount.accountNumber || "",
          balance: savingsAccount.balance || 0,
        },
      };
    });

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("Error fetching student accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}