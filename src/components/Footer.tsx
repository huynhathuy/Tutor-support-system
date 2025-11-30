import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import hcmutLogo from "figma:asset/ce90f0e083eb2e3e7ce46e75119f0f255a3d1fa8.png";

export function Footer() {
  return (
    <footer className="bg-[#0052CC] text-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={hcmutLogo} alt="HCMUT Logo" className="h-10 w-10 bg-white rounded p-1" />
              <span className="text-xl text-white">HCMUT TutorConnect</span>
            </div>
            <p className="text-sm text-blue-200">
              Connecting students with expert tutors worldwide for personalized learning experiences.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white mb-4">For Students</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Find a Tutor</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Reviews</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white mb-4">For Tutors</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Become a Tutor</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Tutor Resources</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-700 mt-12 pt-8 text-sm text-center">
          <p className="text-blue-200">&copy; 2025 HCMUT TutorConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
