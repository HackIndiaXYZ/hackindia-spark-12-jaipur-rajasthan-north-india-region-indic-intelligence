// ============================================================
// CAMPUS HELPER AI - BACKEND SERVER
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// PATHS
// ============================================================

const frontendPath = path.join(__dirname, "..", "frontend");
const dataPath = path.join(__dirname, "data", "campusData.json");

// ============================================================
// DATA
// ============================================================

let campusData = {};
let complaints = [];
let complaintCounter = 1001;

// ============================================================
// LOAD DATA
// ============================================================

try {
    campusData = JSON.parse(
        fs.readFileSync(dataPath, "utf8")
    );

    console.log("✅ Campus data loaded");
} catch (error) {
    console.error("❌ Failed to load campusData.json");
    console.error(error.message);
}

// ============================================================
// HELPERS
// ============================================================

function normalize(value = "") {
    return String(value).toLowerCase().trim();
}

function ok(res, data, extra = {}) {
    res.json({
        success: true,
        ...extra,
        data
    });
}

function fail(res, message, status = 400) {
    res.status(status).json({
        success: false,
        message
    });
}

function getAllSearchData() {
    return [
        ...(campusData.buildings || []).map(item => ({
            type: "Building",
            title: item.name,
            description: item.description || item.type,
            data: item
        })),

        ...(campusData.classrooms || []).map(item => ({
            type: "Classroom",
            title: item.code,
            description:
                `${item.building} • Floor ${item.floor} • ${item.section}`,
            data: item
        })),

        ...(campusData.food || []).map(item => ({
            type: "Food",
            title: item.name,
            description:
                `${item.location} • ${item.timings}`,
            data: item
        })),

        ...(campusData.events || []).map(item => ({
            type: "Event",
            title: item.title,
            description:
                `${item.date} • ${item.venue}`,
            data: item
        })),

        ...(campusData.departments || []).map(item => ({
            type: "Department",
            title: item.name,
            description:
                `${item.shortName} • ${item.building}`,
            data: item
        })),

        ...(campusData.announcements || []).map(item => ({
            type: "Announcement",
            title: item.title,
            description: item.message,
            data: item
        }))
    ];
}

// ============================================================
// AI ENGINE
// ============================================================

function generateAIReply(message) {

    const text = normalize(message);

    // Classroom
    const classroomMatch =
        text.match(/\b([a-z])[- ]?(\d{3})\b/i);

    if (classroomMatch) {

        const code =
            `${classroomMatch[1].toUpperCase()}-${classroomMatch[2]}`;

        const classroom =
            (campusData.classrooms || []).find(
                item =>
                    normalize(item.code) === normalize(code)
            );

        if (classroom) {

            return {
                reply:
                    `🏫 **${classroom.code}**\n\n` +
                    `📍 Building: ${classroom.building}\n` +
                    `🏢 Floor: ${classroom.floor}\n` +
                    `🎓 Section: ${classroom.section}\n` +
                    `👥 Capacity: ${classroom.capacity}\n` +
                    `💻 Type: ${classroom.type}`,
                suggestions: [
                    "Find CSE classrooms",
                    "Where is the library?",
                    "Show upcoming events"
                ]
            };
        }
    }

    // Library
    if (
        text.includes("library") ||
        text.includes("study") ||
        text.includes("seat")
    ) {

        const library = campusData.library || {};
        const floors = library.floors || [];

        const bestFloor =
            floors.length
                ? floors.reduce(
                    (best, current) =>
                        Number(current.availableSeats || 0) >
                        Number(best.availableSeats || 0)
                            ? current
                            : best
                )
                : null;

        return {
            reply:
                `📚 **Central Library**\n\n` +
                `Status: ${library.status || "Unknown"}\n` +
                `Timings: ${library.timings || "Not available"}\n\n` +
                (bestFloor
                    ? `⭐ Best floor right now: **${bestFloor.name}** with ${bestFloor.availableSeats} seats available.`
                    : "Floor availability is currently unavailable."),
            suggestions: [
                "Show library floors",
                "Where can I study?",
                "What are library timings?"
            ]
        };
    }

    // Food
    if (
        text.includes("food") ||
        text.includes("canteen") ||
        text.includes("lunch") ||
        text.includes("breakfast") ||
        text.includes("snack") ||
        text.includes("eat")
    ) {

        const food = campusData.food || [];

        const names =
            food
                .slice(0, 3)
                .map(item => `🍔 ${item.name}`)
                .join("\n");

        return {
            reply:
                `🍔 **Campus Food Spots**\n\n` +
                `${names}\n\n` +
                `You can open the Food section to see timings and menus.`,
            suggestions: [
                "Show food timings",
                "Which canteen is open?",
                "Where can I get coffee?"
            ]
        };
    }

    // Events
    if (
        text.includes("event") ||
        text.includes("hackathon") ||
        text.includes("workshop") ||
        text.includes("sports") ||
        text.includes("club")
    ) {

        const upcoming =
            (campusData.events || [])
                .slice()
                .sort(
                    (a, b) =>
                        new Date(a.date) - new Date(b.date)
                )
                .slice(0, 4);

        const eventText =
            upcoming.length
                ? upcoming
                    .map(
                        event =>
                            `📅 ${event.title}\n` +
                            `   ${event.date} • ${event.venue}`
                    )
                    .join("\n\n")
                : "No upcoming events available.";

        return {
            reply:
                `🎉 **Upcoming Campus Events**\n\n${eventText}`,
            suggestions: [
                "Tell me about the hackathon",
                "Show workshops",
                "Show sports events"
            ]
        };
    }

    // Departments
    if (
        text.includes("department") ||
        text.includes("cse") ||
        text.includes("ece") ||
        text.includes("it") ||
        text.includes("ai ml") ||
        text.includes("faculty")
    ) {

        const departments =
            campusData.departments || [];

        return {
            reply:
                `🎓 **Academic Departments**\n\n` +
                departments
                    .map(
                        item =>
                            `• ${item.name} (${item.shortName}) — ${item.building}`
                    )
                    .join("\n"),
            suggestions: [
                "Find CSE classroom",
                "Find AI-ML classrooms",
                "Show academic buildings"
            ]
        };
    }

    // Emergency
    if (
        text.includes("emergency") ||
        text.includes("security") ||
        text.includes("medical") ||
        text.includes("urgent")
    ) {

        return {
            reply:
                `🚨 **Emergency Help**\n\n` +
                `For immediate campus assistance:\n\n` +
                `🚔 Campus Security: 100\n` +
                `🏥 Medical Help: 108\n` +
                `☎️ Campus Help Desk: 1800-000-2026\n\n` +
                `If this is a real emergency, contact the appropriate service immediately.`,
            suggestions: [
                "Show emergency contacts",
                "Report a campus issue"
            ]
        };
    }

    // WiFi
    if (
        text.includes("wifi") ||
        text.includes("wi-fi") ||
        text.includes("internet") ||
        text.includes("network")
    ) {

        return {
            reply:
                `📡 **Campus Wi-Fi**\n\n` +
                `The latest campus announcement indicates that network maintenance is scheduled between **11:00 PM and 1:00 AM on September 10, 2026**.`,
            suggestions: [
                "Show announcements",
                "Report Wi-Fi problem"
            ]
        };
    }

    // Complaint
    if (
        text.includes("complaint") ||
        text.includes("problem") ||
        text.includes("issue") ||
        text.includes("report")
    ) {

        return {
            reply:
                `🎫 You can report a campus issue from the **Report Issue** section.\n\n` +
                `You can provide:\n` +
                `• Issue title\n` +
                `• Category\n` +
                `• Location\n` +
                `• Priority\n` +
                `• Detailed description`,
            suggestions: [
                "Open Report Issue",
                "How does complaint tracking work?"
            ]
        };
    }

    // Greetings
    if (
        text === "hi" ||
        text === "hello" ||
        text === "hey" ||
        text.includes("good morning") ||
        text.includes("good evening")
    ) {

        return {
            reply:
                `👋 Hey! I'm **Campus Helper AI**.\n\n` +
                `I can help you with classrooms, campus locations, food, library, events, academics, complaints and emergency information.`,
            suggestions: [
                "Find classroom C-204",
                "Where can I study?",
                "Show upcoming events",
                "Show campus food"
            ]
        };
    }

    // Navigation
    if (
        text.includes("where is") ||
        text.includes("location") ||
        text.includes("find") ||
        text.includes("direction")
    ) {

        const searchTerms = [
            "library",
            "building a",
            "building c",
            "lab block",
            "sports complex",
            "auditorium"
        ];

        const found =
            searchTerms.find(term =>
                text.includes(term)
            );

        if (found) {

            const building =
                (campusData.buildings || []).find(
                    item =>
                        normalize(item.name).includes(found)
                );

            if (building) {

                return {
                    reply:
                        `📍 **${building.name}**\n\n` +
                        `${building.description}\n\n` +
                        `🏢 Type: ${building.type}\n` +
                        `📚 Floors: ${building.floors}`,
                    suggestions: [
                        "Show campus map",
                        "Find another location"
                    ]
                };
            }
        }

        return {
            reply:
                `📍 I can help you find campus locations. Try asking something like:\n\n` +
                `• Where is the library?\n` +
                `• Find Building C\n` +
                `• Where is the sports complex?\n` +
                `• Find classroom C-204`,
            suggestions: [
                "Where is the library?",
                "Find Building C",
                "Find classroom C-204"
            ]
        };
    }

    // Default
    return {
        reply:
            `🤖 I understand you're asking about **"${message}"**.\n\n` +
            `I currently specialize in campus-related assistance such as:\n\n` +
            `🏫 Classrooms & locations\n` +
            `📚 Library & study spaces\n` +
            `🍔 Food & canteens\n` +
            `📅 Events\n` +
            `🎓 Academics\n` +
            `🎫 Complaints\n` +
            `🚨 Emergency help`,
        suggestions: [
            "Find classroom C-204",
            "Where is the library?",
            "Show upcoming events",
            "Show campus food"
        ]
    };
}

// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {

    ok(res, {
        status: "online",
        service: "Campus Helper AI",
        timestamp: new Date().toISOString()
    });

});

// ============================================================
// CAMPUS
// ============================================================

app.get("/api/campus", (req, res) => {

    ok(res, campusData.campus || {});

});

// ============================================================
// BUILDINGS
// ============================================================

app.get("/api/buildings", (req, res) => {

    const data = campusData.buildings || [];

    ok(res, data, {
        count: data.length
    });

});

// ============================================================
// CLASSROOMS
// ============================================================

app.get("/api/classrooms", (req, res) => {

    let data =
        campusData.classrooms || [];

    const search =
        normalize(req.query.search);

    if (search) {

        data =
            data.filter(item => {

                const combined =
                    [
                        item.code,
                        item.building,
                        item.section,
                        item.type
                    ]
                        .join(" ");

                return normalize(combined)
                    .includes(search);
            });
    }

    ok(res, data, {
        count: data.length
    });

});

// ============================================================
// SINGLE CLASSROOM
// ============================================================

app.get("/api/classrooms/:code", (req, res) => {

    const code =
        normalize(
            req.params.code
        );

    const classroom =
        (campusData.classrooms || [])
            .find(
                item =>
                    normalize(item.code) === code
            );

    if (!classroom) {

        return fail(
            res,
            "Classroom not found",
            404
        );
    }

    ok(res, classroom);

});

// ============================================================
// FOOD
// ============================================================

app.get("/api/food", (req, res) => {

    const data =
        campusData.food || [];

    ok(res, data, {
        count: data.length
    });

});

// ============================================================
// FOOD TIMINGS
// ============================================================

app.get("/api/food-timings", (req, res) => {

    ok(
        res,
        campusData.foodTimings || {}
    );

});

// ============================================================
// LIBRARY
// ============================================================

app.get("/api/library", (req, res) => {

    ok(
        res,
        campusData.library || {}
    );

});

// ============================================================
// EVENTS
// ============================================================

app.get("/api/events", (req, res) => {

    let data =
        campusData.events || [];

    const category =
        normalize(req.query.category);

    if (category) {

        data =
            data.filter(
                item =>
                    normalize(item.category)
                        .includes(category)
            );
    }

    data =
        data
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

    ok(res, data, {
        count: data.length
    });

});

// ============================================================
// ANNOUNCEMENTS
// ============================================================

app.get("/api/announcements", (req, res) => {

    ok(
        res,
        campusData.announcements || []
    );

});

// ============================================================
// DEPARTMENTS
// ============================================================

app.get("/api/departments", (req, res) => {

    ok(
        res,
        campusData.departments || []
    );

});

// ============================================================
// EMERGENCY
// ============================================================

app.get("/api/emergency", (req, res) => {

    ok(
        res,
        campusData.emergency || []
    );

});

// ============================================================
// GLOBAL SEARCH
// ============================================================

app.get("/api/search", (req, res) => {

    const query =
        normalize(req.query.q);

    if (!query) {

        return ok(res, []);

    }

    const results =
        getAllSearchData()
            .filter(item => {

                const combined =
                    `${item.title} ${item.description}`;

                return normalize(combined)
                    .includes(query);
            })
            .slice(0, 20);

    ok(res, results, {
        count: results.length
    });

});

// ============================================================
// AI CHAT
// ============================================================

app.post("/api/ai/chat", (req, res) => {

    const message =
        String(
            req.body?.message || ""
        ).trim();

    if (!message) {

        return fail(
            res,
            "Message is required"
        );
    }

    const result =
        generateAIReply(message);

    ok(res, result);

});

// ============================================================
// CREATE COMPLAINT
// ============================================================

app.post("/api/complaints", (req, res) => {

    const {
        title,
        category,
        description,
        location,
        priority
    } = req.body || {};

    if (!title || !description) {

        return fail(
            res,
            "Title and description are required"
        );
    }

    const complaint = {

        id:
            `CMP-${complaintCounter++}`,

        title:
            String(title).trim(),

        category:
            String(category || "General").trim(),

        description:
            String(description).trim(),

        location:
            String(location || "Not specified").trim(),

        priority:
            String(priority || "Medium").trim(),

        status:
            "Submitted",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };

    complaints.push(complaint);

    ok(
        res,
        complaint,
        {
            message:
                "Complaint submitted successfully"
        }
    );

});

// ============================================================
// GET COMPLAINTS
// ============================================================

app.get("/api/complaints", (req, res) => {

    ok(res, complaints, {
        count: complaints.length
    });

});

// ============================================================
// UPDATE COMPLAINT
// ============================================================

app.patch("/api/complaints/:id", (req, res) => {

    const complaint =
        complaints.find(
            item =>
                item.id === req.params.id
        );

    if (!complaint) {

        return fail(
            res,
            "Complaint not found",
            404
        );
    }

    const allowedFields = [
        "status",
        "priority",
        "category",
        "location"
    ];

    allowedFields.forEach(field => {

        if (
            req.body[field] !== undefined
        ) {

            complaint[field] =
                String(req.body[field]);

        }

    });

    complaint.updatedAt =
        new Date().toISOString();

    ok(res, complaint);

});

// ============================================================
// STATISTICS
// ============================================================

app.get("/api/stats", (req, res) => {

    const stats = {

        buildings:
            (campusData.buildings || []).length,

        classrooms:
            (campusData.classrooms || []).length,

        foodSpots:
            (campusData.food || []).length,

        events:
            (campusData.events || []).length,

        departments:
            (campusData.departments || []).length,

        complaints:
            complaints.length,

        pendingComplaints:
            complaints.filter(
                item =>
                    item.status !== "Resolved"
            ).length

    };

    ok(res, stats);

});

// ============================================================
// STATIC FRONTEND
// ============================================================

app.use(
    express.static(frontendPath)
);

// ============================================================
// FRONTEND FALLBACK
// ============================================================

app.use((req, res, next) => {

    if (
        req.path.startsWith("/api")
    ) {

        return next();

    }

    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );

});

// ============================================================
// 404 API
// ============================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });

});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {

    console.error("Server error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });

});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("🚀 CAMPUS HELPER AI SERVER");
    console.log("======================================");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(
        `❤️  http://localhost:${PORT}/api/health`
    );
    console.log(
        `🤖 http://localhost:${PORT}/api/ai/chat`
    );
    console.log(
        `📊 http://localhost:${PORT}/api/stats`
    );
    console.log("======================================");
    console.log("");

});