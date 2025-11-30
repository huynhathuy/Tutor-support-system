import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Star, Clock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BookingDialog } from "./BookingDialog";

interface TutorCardProps {
  name: string;
  subject: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  tags: string[];
}

export function TutorCard({ name, subject, rating, students, price, image, tags }: TutorCardProps) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-white">
        <CardContent className="p-0">
          <div className="relative">
            <ImageWithFallback
              src={image}
              alt={name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <Badge className="absolute top-3 right-3 bg-[#0052CC] text-white">
              ${price}/hr
            </Badge>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-xl text-blue-900">{name}</h3>
              <p className="text-sm text-blue-600">{subject}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-blue-900">{rating}</span>
                <span className="text-blue-600">({students} students)</span>
              </div>
            </div>
            
            <Button className="w-full bg-[#0052CC] hover:bg-blue-700" onClick={() => setBookingOpen(true)}>
              Book Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        tutorName={name}
        tutorSubject={subject}
        price={price}
      />
    </>
  );
}
