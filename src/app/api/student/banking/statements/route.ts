import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

// Helper to convert month name to number
const monthToNumber = (monthName: string): number => {
  const months: Record<string, number> = {
    "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
    "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
  };
  return months[monthName] || 0;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId");
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    
    if (!accountId || !month || !year) {
      return NextResponse.json({ 
        error: "Account ID, month, and year are required" 
      }, { status: 400 });
    }

    // Find the student record for the authenticated user
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        class: true // Include class info for the statement header
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Verify account belongs to the current student
    const account = await db.bankAccount.findUnique({
      where: {
        id: accountId,
        studentId: student.id,
      },
    });
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Calculate start and end dates for the month
    const monthNum = monthToNumber(month);
    const startDate = new Date(parseInt(year), monthNum, 1);
    const endDate = new Date(parseInt(year), monthNum + 1, 0);

    // Get transactions for this account within the date range
    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { accountId },
          { receivingAccountId: accountId }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format the data for Excel
    const statementData = transactions.map(transaction => ({
      Date: format(new Date(transaction.createdAt), 'MM/dd/yyyy'),
      Time: format(new Date(transaction.createdAt), 'HH:mm:ss'),
      Description: transaction.description,
      Type: transaction.transactionType,
      Amount: transaction.amount.toFixed(2),
      // For the balance column, we would typically calculate the running balance
      // This would require more complex logic that we're simplifying here
    }));

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(statementData);

    // Add headers
    XLSX.utils.sheet_add_aoa(ws, [
    [`Student: ${student.firstName} ${student.lastName}`],
    [`Class: ${student.class?.name || 'N/A'}`],
    [`Account: ${account.accountType} (${account.accountNumber})`],
    [`Statement Period: ${month} ${year}`],
    [`Current Balance: $${account.balance.toFixed(2)}`],
    [''] // Empty row
    ], { origin: 'A1' });

    // Add data starting at A7
    XLSX.utils.sheet_add_json(ws, statementData, { origin: 'A7' });

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Statement');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Convert to Buffer for response
    const buffer = Buffer.from(excelBuffer);
        
    // Create headers for file download
    const headers = new Headers();
    headers.append('Content-Disposition', `attachment; filename="${account.accountType}_${month}_${year}_statement.xlsx"`);
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error generating statement:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}