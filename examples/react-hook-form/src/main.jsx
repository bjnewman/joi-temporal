import "temporal-polyfill/global";
import { createRoot } from "react-dom/client";
import { BookingForm } from "./BookingForm.jsx";

const root = createRoot(document.getElementById("root"));
root.render(<BookingForm />);
