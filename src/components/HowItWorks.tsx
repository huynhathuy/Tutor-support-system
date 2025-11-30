import { Search, Calendar, Video, Award } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find Your Tutor",
    description: "Browse through hundreds of verified tutors and find the perfect match for your learning goals."
  },
  {
    icon: Calendar,
    title: "Book a Session",
    description: "Choose a convenient time slot that fits your schedule and book your first session."
  },
  {
    icon: Video,
    title: "Start Learning",
    description: "Join your session through our video platform and enjoy personalized one-on-one tutoring."
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your improvement with detailed progress reports and achievement milestones."
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl mb-4 text-blue-900">How It Works</h2>
          <p className="text-xl text-blue-700">
            Get started in just four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0052CC] text-white mb-4">
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl mb-2 text-blue-900">{step.title}</h3>
              <p className="text-blue-600">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-blue-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
