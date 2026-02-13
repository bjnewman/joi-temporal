import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { bookingSchema } from "./schema.js";

export function BookingForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: joiResolver(bookingSchema),
        defaultValues: {
            duration: "PT1H",
        },
    });

    const onSubmit = (data) => {
        // At this point, all values are Temporal objects
        const endTime = data.meetingTime.add(data.duration);

        alert(
            [
                `Booking confirmed!`,
                ``,
                `Start: ${data.startDate} at ${data.meetingTime}`,
                `End: ${data.endDate} at ${endTime}`,
                `Duration: ${data.duration}`,
                ``,
                `Types:`,
                `  startDate: ${data.startDate.constructor.name}`,
                `  meetingTime: ${data.meetingTime.constructor.name}`,
                `  duration: ${data.duration.constructor.name}`,
            ].join("\n"),
        );
    };

    return (
        <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "system-ui" }}>
            <h1>Book a Meeting</h1>
            <p style={{ color: "#666" }}>
                joi-temporal validates and coerces HTML date/time inputs into Temporal objects.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Field label="Start Date" error={errors.startDate}>
                    <input type="date" {...register("startDate")} />
                </Field>

                <Field label="End Date" error={errors.endDate}>
                    <input type="date" {...register("endDate")} />
                </Field>

                <Field label="Meeting Time" error={errors.meetingTime}>
                    <input type="time" {...register("meetingTime")} />
                </Field>

                <Field label="Duration (ISO 8601)" error={errors.duration}>
                    <select {...register("duration")}>
                        <option value="PT15M">15 minutes</option>
                        <option value="PT30M">30 minutes</option>
                        <option value="PT1H">1 hour</option>
                        <option value="PT1H30M">1.5 hours</option>
                        <option value="PT2H">2 hours</option>
                        <option value="PT4H">4 hours</option>
                    </select>
                </Field>

                <button
                    type="submit"
                    style={{
                        marginTop: 16,
                        padding: "8px 24px",
                        fontSize: 16,
                        cursor: "pointer",
                    }}
                >
                    Book
                </button>
            </form>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                {label}
            </label>
            {children}
            {error && (
                <div style={{ color: "red", fontSize: 14, marginTop: 4 }}>
                    {error.message}
                </div>
            )}
        </div>
    );
}
