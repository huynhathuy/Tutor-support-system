import { Button } from "./ui/button";
import hcmutLogo from "figma:asset/ce90f0e083eb2e3e7ce46e75119f0f255a3d1fa8.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={hcmutLogo} alt="HCMUT Logo" className="h-12 w-12" />
          <div className="flex flex-col">
            <span className="text-lg text-[#0052CC]">HCMUT TutorConnect</span>
            <span className="text-xs text-blue-600">Bach Khoa Learning Platform</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm text-blue-700 hover:text-[#0052CC] transition-colors">
            Find Tutors
          </a>
          <a href="#" className="text-sm text-blue-700 hover:text-[#0052CC] transition-colors">
            How it Works
          </a>
          <a href="#" className="text-sm text-blue-700 hover:text-[#0052CC] transition-colors">
            Subjects
          </a>
          <a href="#" className="text-sm text-blue-700 hover:text-[#0052CC] transition-colors">
            Pricing
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex text-blue-700 hover:text-[#0052CC] hover:bg-blue-50">
            Sign In
          </Button>
          <Button className="bg-[#0052CC] hover:bg-blue-700">Get Started</Button>
        </div>
      </div>
    </header>
  );
}
