/**
 * Hapi server with joi-temporal validation.
 *
 *   node --import temporal-polyfill/global server.js
 *
 * Then test with:
 *   curl -X POST http://localhost:3000/bookings \
 *     -H "Content-Type: application/json" \
 *     -d '{"date":"2026-06-15","startTime":"10:00","duration":"PT1H30M"}'
 */
import Hapi from "@hapi/hapi";
import Joi from "joi";
import joiTemporal from "@bjn/joi-temporal";

const custom = Joi.extend(...joiTemporal);

const init = async () => {
    const server = Hapi.server({ port: 3000, host: "localhost" });

    server.route({
        method: "POST",
        path: "/bookings",
        options: {
            validate: {
                payload: custom.object({
                    date: custom
                        .plainDate()
                        .min("now")
                        .max("2026-12-31")
                        .required()
                        .messages({
                            "temporal.plainDate.min": "{{#label}} must be today or a future date",
                        }),
                    startTime: custom
                        .plainTime()
                        .min("09:00")
                        .max("17:00")
                        .required()
                        .messages({
                            "temporal.plainTime.min": "{{#label}} must be during business hours (9am-5pm)",
                            "temporal.plainTime.max": "{{#label}} must be during business hours (9am-5pm)",
                        }),
                    duration: custom
                        .duration()
                        .positive()
                        .min("PT30M")
                        .max("PT4H")
                        .required(),
                }),
                failAction: (request, h, err) => {
                    return h
                        .response({
                            error: "Validation failed",
                            details: err.details.map((d) => ({
                                field: d.path.join("."),
                                message: d.message,
                            })),
                        })
                        .code(400)
                        .takeover();
                },
            },
        },
        handler(request) {
            const { date, startTime, duration } = request.payload;
            const endTime = startTime.add(duration);

            return {
                booking: {
                    date: date.toString(),
                    startTime: startTime.toString(),
                    endTime: endTime.toString(),
                    duration: duration.toString(),
                },
            };
        },
    });

    await server.start();
    console.log("Server running at %s", server.info.uri);
    console.log();
    console.log("Try:");
    console.log(
        `  curl -s -X POST ${server.info.uri}/bookings \\`,
    );
    console.log('    -H "Content-Type: application/json" \\');
    console.log("    -d '{\"date\":\"2026-06-15\",\"startTime\":\"10:00\",\"duration\":\"PT1H30M\"}' | jq");
};

init();
