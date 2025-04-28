import { db } from "@/src/lib/db";
import { generateAccountNumber } from "@/src/lib/utils";

// Shared function for creating student bank accounts
export async function setupBankAccountsForStudent(studentId: string) {
  // Check if accounts already exist
  const existingAccounts = await db.bankAccount.findMany({
    where: { studentId }
  });
  
  if (existingAccounts.length > 0) {
    // Format existing accounts with display numbers
    const accountsWithPrefixes = existingAccounts.map(account => {
      const prefix = account.accountType === "CHECKING" ? "CH" : "SV";
      return {
        ...account,
        displayAccountNumber: `${prefix}${account.accountNumber}`
      };
    });
    return { success: true, data: accountsWithPrefixes };
  }
  
  // Create checking and savings accounts
  const [checkingAccount, savingsAccount] = await db.$transaction([
    // Create checking account
    db.bankAccount.create({
      data: {
        accountNumber: generateAccountNumber(),
        accountType: "CHECKING",
        balance: 100, // Starting balance for checking
        studentId
      }
    }),
    
    // Create savings account
    db.bankAccount.create({
      data: {
        accountNumber: generateAccountNumber(),
        accountType: "SAVINGS",
        balance: 50, // Starting balance for savings
        studentId
      }
    })
  ]);
  
  // Format accounts with display numbers
  const formattedAccounts = [
    { 
      ...checkingAccount, 
      displayAccountNumber: `CH${checkingAccount.accountNumber}` 
    },
    { 
      ...savingsAccount, 
      displayAccountNumber: `SV${savingsAccount.accountNumber}` 
    }
  ];

  return { success: true, data: formattedAccounts };
}