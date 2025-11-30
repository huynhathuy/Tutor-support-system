import { BookOpen, Code, Languages, Calculator, Palette, Music } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const categories = [
  { icon: Calculator, name: "Mathematics", count: 1234, color: "bg-blue-100 text-[#0052CC]" },
  { icon: Code, name: "Programming", count: 856, color: "bg-blue-50 text-blue-700" },
  { icon: Languages, name: "Languages", count: 943, color: "bg-blue-100 text-blue-800" },
  { icon: BookOpen, name: "Science", count: 721, color: "bg-sky-100 text-sky-700" },
  { icon: Palette, name: "Arts & Design", count: 512, color: "bg-cyan-100 text-cyan-700" },
  { icon: Music, name: "Music", count: 634, color: "bg-blue-50 text-blue-600" },
];

export function SubjectCategories() {
  return (
    <section className="py-20 bg-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4 text-blue-900">Browse by Subject</h2>
          <p className="text-xl text-blue-700">
            Explore thousands of tutors across all subjects
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-blue-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${category.color} mb-4`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-1 text-blue-900">{category.name}</h3>
                <p className="text-sm text-blue-600">{category.count} tutors</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
