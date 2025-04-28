import Image from "next/image"
import Link from "next/link"

import main_layout_logo from "@/public/assets/img/Primary Logo - Colorfu Black Greenldpi.png"

export function MainLoginLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative flex items-center">
        <Image
          src={main_layout_logo}
          alt="ShortStacks Logo"
          width={200}
          height={80}
          priority
          className="h-16 w-auto"
        />
      </div>
    </Link>
  )
}