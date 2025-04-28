'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { toast } from "sonner"

interface BankStatementsProps {
  accounts: any[]
}

export default function BankStatements({ accounts }: BankStatementsProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  
  // Set initial account if one exists
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);
  
  // Available years - typically we'd have this from the backend
  const years = Array.from(
    { length: 3 }, 
    (_, i) => (new Date().getFullYear() - i).toString()
  )
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentYear = currentDate.getFullYear()
  
  // Months for statements
  const months = [
    { name: "January", abbr: "JAN.", index: 0 },
    { name: "February", abbr: "FEB.", index: 1 },
    { name: "March", abbr: "MAR.", index: 2 },
    { name: "April", abbr: "APR.", index: 3 },
    { name: "May", abbr: "MAY", index: 4 },
    { name: "June", abbr: "JUN.", index: 5 },
    { name: "July", abbr: "JUL.", index: 6 },
    { name: "August", abbr: "AUG.", index: 7 },
    { name: "September", abbr: "SEP.", index: 8 },
    { name: "October", abbr: "OCT.", index: 9 },
    { name: "November", abbr: "NOV.", index: 10 },
    { name: "December", abbr: "DEC.", index: 11 }
  ]
  
  const handleDownloadStatement = (month: string, monthIndex: number) => {
    const selectedYearNum = parseInt(selectedYear)
    
    // Check if the month is in the future or current month
    if (selectedYearNum > currentYear || 
        (selectedYearNum === currentYear && monthIndex >= currentMonth)) {
      // Future or current month - do nothing
      return
    } else {
      // Past month - normally we'd try to fetch the statement here
      toast.error(`No statement records found for ${month} ${selectedYear}`)
    }
  }
  
  // Helper to determine if a folder should be greyed out
  const isDisabled = (monthIndex: number) => {
    const selectedYearNum = parseInt(selectedYear)
    return selectedYearNum > currentYear || 
          (selectedYearNum === currentYear && monthIndex >= currentMonth)
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">View Statements</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select 
          value={selectedYear} 
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="w-full sm:w-[200px] border-orange-500 text-orange-500">
            <SelectValue placeholder={selectedYear} />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 justify-items-center">
        {months.map((month) => {
          const disabled = isDisabled(month.index);
          
          return (
            <div 
              key={month.abbr}
              className={`relative cursor-pointer transition-transform hover:scale-105 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !disabled && handleDownloadStatement(month.name, month.index)}
            >
              {/* Custom styled folder to match the second image exactly */}
              <div className="relative w-36 h-28 shadow-md rounded-md">
                {/* Top folder tab */}
                <div className="absolute -top-3 left-2 w-10 h-3 bg-green-700 rounded-t-md z-10"></div>
                
                {/* Main folder body with gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b from-green-600 to-green-400 rounded-md flex flex-col items-center justify-center`}>
                  {/* Month abbreviation */}
                  <div className="absolute top-3 left-4 text-white font-bold text-2xl">
                    {month.abbr}
                  </div>
                  
                  {/* Download icon */}
                  <div className="mt-6 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                  </svg>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}