'use client'

import { formatCurrency } from "@/src/lib/utils"

interface AccountCardProps {
  type: "CHECKING" | "SAVINGS"
  title: string
  balance: number
  accountNumber: string
  className?: string
}

const AccountCard = ({
  type,
  title,
  balance,
  accountNumber,
  className = ""
}: AccountCardProps) => {
  // Get the formatted account number with prefix
  const formattedAccountNumber = formatAccountNumber(type, accountNumber)
  
  // Define styles based on type
  const backgroundColor = type === "CHECKING" ? "bg-green-500" : "bg-orange-500"
  
  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className={`${backgroundColor} p-6 text-white`}>
        <div className="mb-2 text-sm font-medium">{title}</div>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">$</span>
          <span className="text-5xl font-bold"> {formatCurrency(balance, false)}</span>
        </div>
      </div>
    </div>
  )
}

const formatAccountNumber = (type: "CHECKING" | "SAVINGS", number: string) => {
  const prefix = type === "CHECKING" ? "CH" : "SV"
  return `${prefix}${number.replace(/\D/g, '')}`
}

export default AccountCard