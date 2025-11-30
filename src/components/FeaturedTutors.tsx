import { TutorCard } from "./TutorCard";

const tutors = [
  {
    name: "Dr. Sarah Johnson",
    subject: "Mathematics & Calculus",
    rating: 4.9,
    students: 324,
    price: 45,
    image: "https://images.unsplash.com/photo-1584554376766-ac0f2c65e949?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYxNjE1NzE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["PhD", "10+ years", "Certified"]
  },
  {
    name: "Michael Chen",
    subject: "Computer Science & Programming",
    rating: 5.0,
    students: 512,
    price: 50,
    image: "https://images.unsplash.com/photo-1729824186959-ba83cbd1978d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBoYXBweXxlbnwxfHx8fDE3NjE1NjkyMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Software Engineer", "8+ years", "Python Expert"]
  },
  {
    name: "Emma Williams",
    subject: "English & Literature",
    rating: 4.8,
    students: 289,
    price: 40,
    image: "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXRoZW1hdGljcyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjE1NjU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Masters", "IELTS Specialist", "Creative Writing"]
  }
];

export function FeaturedTutors() {
  return (
    <section className="py-20 bg-blue-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4 text-blue-900">Featured Tutors</h2>
          <p className="text-xl text-blue-700">
            Learn from the best educators around the world
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutors.map((tutor, index) => (
            <TutorCard key={index} {...tutor} />
          ))}
        </div>
      </div>
    </section>
  );
}
