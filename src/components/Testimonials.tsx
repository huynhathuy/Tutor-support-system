import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

const testimonials = [
  {
    name: "Alex Thompson",
    role: "High School Student",
    content: "TutorConnect helped me improve my math grades from C to A in just 3 months. My tutor was patient and explained concepts in ways I could understand.",
    rating: 5,
    initials: "AT"
  },
  {
    name: "Jennifer Lee",
    role: "College Student",
    content: "The flexibility to schedule sessions around my busy schedule is amazing. I've learned so much about programming from my tutor.",
    rating: 5,
    initials: "JL"
  },
  {
    name: "David Martinez",
    role: "Working Professional",
    content: "I wanted to learn Spanish for my job, and TutorConnect made it so easy. The quality of tutors is outstanding!",
    rating: 5,
    initials: "DM"
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-blue-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4 text-blue-900">What Our Students Say</h2>
          <p className="text-xl text-blue-700">
            Join thousands of satisfied learners
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-blue-200 bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-blue-700">{testimonial.content}</p>
                
                <div className="flex items-center gap-3 pt-4">
                  <Avatar>
                    <AvatarFallback className="bg-[#0052CC] text-white">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-blue-900">{testimonial.name}</div>
                    <div className="text-sm text-blue-600">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
