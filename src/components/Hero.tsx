import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import hcmutLogo from "figma:asset/ce90f0e083eb2e3e7ce46e75119f0f255a3d1fa8.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-blue-100/30 to-white py-20">
      <div className="absolute top-8 right-8 opacity-10">
        <img src={hcmutLogo} alt="HCMUT" className="h-64 w-64" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <img src={hcmutLogo} alt="HCMUT Logo" className="h-16 w-16" />
              <div className="flex flex-col">
                <span className="text-sm text-blue-600">Ho Chi Minh City University of Technology</span>
                <span className="text-xs text-blue-500">Bach Khoa</span>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl text-blue-900">
              Learn Anything,
              <span className="text-[#0052CC]"> Anywhere</span>
            </h1>
            <p className="text-xl text-blue-700">
              Connect with expert tutors for personalized 1-on-1 sessions. Master any subject at your own pace.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search for a subject or tutor..."
                  className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
                />
              </div>
              <Button size="lg" className="sm:w-auto bg-[#0052CC] hover:bg-blue-700">
                Find a Tutor
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-6">
              <div>
                <div className="text-3xl text-[#0052CC]">10k+</div>
                <div className="text-sm text-blue-600">Expert Tutors</div>
              </div>
              <div>
                <div className="text-3xl text-[#0052CC]">50k+</div>
                <div className="text-sm text-blue-600">Happy Students</div>
              </div>
              <div>
                <div className="text-3xl text-[#0052CC]">4.9/5</div>
                <div className="text-sm text-blue-600">Average Rating</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1586388750948-16833a41ee95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjB0dXRvcmluZyUyMHN0dWRlbnR8ZW58MXx8fHwxNzYxNjU4MDA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Student learning online"
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
