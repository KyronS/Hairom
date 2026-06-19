import { BUSINESS_NAME } from "@/lib/config";

export const metadata = {
  title: `Book an Appointment | ${BUSINESS_NAME}`,
  description:
    "Book a haircut, loc maintenance, natural hairstyle, or hair dye appointment with Hairom Barbershop in San Fernando, Trinidad. Fast online booking.",
};

export default function BookingLayout({ children }) {
  return children;
}
