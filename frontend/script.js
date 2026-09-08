// ============================================================
// CAMPUS HELPER AI - FRONTEND JAVASCRIPT v2
// ============================================================

const API = "/api";

let campusData = {};
let buildings = [];
let classrooms = [];
let foodSpots = [];
let libraryData = {};
let events = [];
let departments = [];
let announcements = [];
let complaints = [];


// ============================================================
// API
// ============================================================

async function api(endpoint, options = {}) {

    try {

        const response =
            await fetch(
                API + endpoint,
                options
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "API request failed"
            );

        }

        return result;

    } catch (error) {

        console.error(
            "API Error:",
            endpoint,
            error
        );

        showToast(
            "Unable to connect to Campus Helper server",
            "error"
        );

        return null;

    }

}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


async function initializeApp() {

    loadTheme();

    setupGlobalSearch();

    setupAI();

    setupComplaintForm();

    await loadCampusData();

    await loadAnnouncements();

    await loadComplaints();

    await loadEmergency();

    console.log(
        "✅ Campus Helper AI initialized"
    );

}


// ============================================================
// LOAD CAMPUS DATA
// ============================================================

async function loadCampusData() {

    const results =
        await Promise.all([

            api("/campus"),
            api("/buildings"),
            api("/classrooms"),
            api("/food"),
            api("/library"),
            api("/events"),
            api("/departments")

        ]);

    campusData =
        results[0]?.data || {};

    buildings =
        results[1]?.data || [];

    classrooms =
        results[2]?.data || [];

    foodSpots =
        results[3]?.data || [];

    libraryData =
        results[4]?.data || {};

    events =
        results[5]?.data || [];

    departments =
        results[6]?.data || [];

    updateDashboard();

    renderBuildings();

    renderFood();

    renderLibrary();

    renderEvents();

    renderAcademics();

}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(
    pageName,
    clickedButton = null
) {

    document
        .querySelectorAll(".page")
        .forEach(
            page =>
                page.classList.remove("active")
        );

    const page =
        document.getElementById(
            `${pageName}-page`
        );

    if (!page) {

        showToast(
            `Page "${pageName}" not found`,
            "error"
        );

        return;

    }

    page.classList.add("active");

    document
        .querySelectorAll(".nav-item")
        .forEach(
            item =>
                item.classList.remove("active")
        );

    if (clickedButton) {

        clickedButton.classList.add("active");

    }

    if (pageName === "dashboard")
        updateDashboard();

    if (pageName === "assistant")
        setupAI();

    if (pageName === "map")
        renderBuildings();

    if (pageName === "food")
        renderFood();

    if (pageName === "library")
        renderLibrary();

    if (pageName === "events")
        renderEvents();

    if (pageName === "academics")
        renderAcademics();

    if (pageName === "complaints")
        loadComplaints();

    if (pageName === "emergency")
        loadEmergency();

    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar)
        sidebar.classList.remove(
            "mobile-open"
        );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    setText(
        "building-count",
        buildings.length
    );

    setText(
        "classroom-count",
        classrooms.length
    );

    setText(
        "food-count",
        foodSpots.length
    );

    setText(
        "event-count",
        events.length
    );

    setText(
        "stat-buildings",
        buildings.length
    );

    setText(
        "stat-classrooms",
        classrooms.length
    );

    setText(
        "stat-food",
        foodSpots.length
    );

    setText(
        "stat-events",
        events.length
    );

    renderDashboardFood();

    renderDashboardEvents();

}


// ============================================================
// DASHBOARD FOOD
// ============================================================

function renderDashboardFood() {

    const container =
        document.getElementById(
            "dashboard-food"
        );

    if (!container) return;

    container.innerHTML =
        foodSpots
            .slice(0, 3)
            .map(
                item => `
                <div class="mini-card">
                    <div class="mini-icon">🍔</div>
                    <div>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                        <small>
                            ${escapeHTML(item.location)}
                        </small>
                    </div>
                </div>
                `
            )
            .join("");

}


// ============================================================
// DASHBOARD EVENTS
// ============================================================

function renderDashboardEvents() {

    const container =
        document.getElementById(
            "dashboard-events"
        );

    if (!container) return;

    container.innerHTML =
        events
            .slice(0, 4)
            .map(
                event => `
                <div class="mini-card">
                    <div class="mini-icon">📅</div>
                    <div>
                        <strong>
                            ${escapeHTML(event.title)}
                        </strong>
                        <small>
                            ${escapeHTML(event.date)}
                            •
                            ${escapeHTML(event.venue)}
                        </small>
                    </div>
                </div>
                `
            )
            .join("");

}


// ============================================================
// BUILDINGS
// ============================================================

function renderBuildings() {

    const container =
        document.getElementById(
            "map-buildings"
        ) ||
        document.getElementById(
            "building-list"
        );

    if (!container) return;

    container.innerHTML =
        buildings
            .map(
                building => `
                <div
                    class="location-card"
                    onclick="openLocation('${escapeAttribute(building.name)}')"
                >
                    <div class="location-icon">
                        🏢
                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(building.name)}
                        </h3>

                        <p>
                            ${escapeHTML(building.type)}
                        </p>

                        <small>
                            ${escapeHTML(
                                building.description || ""
                            )}
                        </small>
                    </div>
                </div>
                `
            )
            .join("");

}


// ============================================================
// OPEN LOCATION
// ============================================================

function openLocation(name) {

    const building =
        buildings.find(
            item =>
                item.name.toLowerCase() ===
                String(name).toLowerCase()
        );

    if (!building) {

        showToast(
            "Location not found",
            "error"
        );

        return;

    }

    const result =
        document.getElementById(
            "location-result"
        );

    if (result) {

        result.innerHTML = `
            <div class="location-detail">
                <h3>📍 ${escapeHTML(building.name)}</h3>
                <p>
                    ${escapeHTML(
                        building.description || ""
                    )}
                </p>
                <span>
                    🏢 ${escapeHTML(building.type)}
                </span>
                <span>
                    📚 ${building.floors} floors
                </span>
            </div>
        `;

    }

    showToast(
        `📍 ${building.name} • ${building.floors} floors`,
        "success"
    );

}


// ============================================================
// LOCATION SEARCH
// ============================================================

async function findLocation() {

    const input =
        document.getElementById(
            "location-search"
        );

    if (!input) return;

    const query =
        input.value.trim();

    if (!query) {

        showToast(
            "Enter a location",
            "error"
        );

        return;

    }

    const result =
        await api(
            "/search?q=" +
            encodeURIComponent(query)
        );

    if (!result) return;

    const results =
        result.data || [];

    const location =
        results.find(
            item =>
                item.type === "Building"
        );

    if (!location) {

        showToast(
            "Location not found",
            "error"
        );

        return;

    }

    openLocation(
        location.title
    );

}


// ============================================================
// FOOD
// ============================================================

function renderFood() {

    const container =
        document.getElementById(
            "food-list"
        ) ||
        document.getElementById(
            "food-grid"
        );

    if (!container) return;

    container.innerHTML =
        foodSpots
            .map(
                item => `
                <div class="food-card">

                    <div class="food-image">
                        🍔
                    </div>

                    <div class="food-content">

                        <h3>
                            ${escapeHTML(item.name)}
                        </h3>

                        <p>
                            📍 ${escapeHTML(item.location)}
                        </p>

                        <p>
                            ⏰ ${escapeHTML(item.timings)}
                        </p>

                        <span class="status-badge">
                            🟢 ${escapeHTML(item.status)}
                        </span>

                        <div class="food-menu">
                            ${
                                Array.isArray(item.menu)
                                    ? item.menu
                                        .map(
                                            menu =>
                                                `<span>
                                                    ${escapeHTML(menu)}
                                                </span>`
                                        )
                                        .join("")
                                    : ""
                            }
                        </div>

                    </div>

                </div>
                `
            )
            .join("");

    loadFoodTimings();

}


// ============================================================
// FOOD TIMINGS
// ============================================================

async function loadFoodTimings() {

    const result =
        await api(
            "/food-timings"
        );

    if (!result) return;

    const container =
        document.getElementById(
            "food-timings"
        );

    if (!container) return;

    container.innerHTML =
        Object.entries(
            result.data || {}
        )
            .map(
                ([meal, time]) => `
                <div class="timing-card">
                    <span>🍽️</span>
                    <strong>
                        ${escapeHTML(meal)}
                    </strong>
                    <small>
                        ${escapeHTML(time)}
                    </small>
                </div>
                `
            )
            .join("");

}


// ============================================================
// LIBRARY
// ============================================================

function renderLibrary() {

    const data =
        libraryData || {};

    const floors =
        data.floors || [];

    setText(
        "library-name",
        data.name || "Central Library"
    );

    setText(
        "library-status",
        data.status || "Unknown"
    );

    setText(
        "library-occupancy",
        `${data.overallCapacity || 0}%`
    );

    setText(
        "library-percent",
        `${data.overallCapacity || 0}%`
    );

    setText(
        "library-timings",
        data.timings || "Not available"
    );

    const totalSeats =
        floors.reduce(
            (sum, floor) =>
                sum +
                Number(
                    floor.totalSeats || 0
                ),
            0
        );

    const availableSeats =
        floors.reduce(
            (sum, floor) =>
                sum +
                Number(
                    floor.availableSeats || 0
                ),
            0
        );

    setText(
        "library-total-seats",
        totalSeats
    );

    setText(
        "library-available-seats",
        availableSeats
    );

    const container =
        document.getElementById(
            "library-floors"
        ) ||
        document.getElementById(
            "library-floors-grid"
        );

    if (!container) return;

    container.innerHTML =
        floors
            .map(
                floor => {

                    const total =
                        Number(
                            floor.totalSeats || 0
                        );

                    const available =
                        Number(
                            floor.availableSeats || 0
                        );

                    const occupied =
                        Math.max(
                            0,
                            total - available
                        );

                    const percentage =
                        total
                            ? Math.round(
                                occupied /
                                total *
                                100
                            )
                            : 0;

                    return `
                        <div class="floor-card">

                            <div class="floor-header">
                                <strong>
                                    📚 ${escapeHTML(
                                        floor.name
                                    )}
                                </strong>

                                <span>
                                    ${available}
                                    seats free
                                </span>
                            </div>

                            <div class="progress-bar">
                                <div
                                    class="progress-fill"
                                    style="width:${percentage}%"
                                ></div>
                            </div>

                            <small>
                                ${occupied}
                                occupied /
                                ${total}
                                total
                            </small>

                        </div>
                    `;

                }
            )
            .join("");

}


// ============================================================
// EVENTS
// ============================================================

function renderEvents() {

    const container =
        document.getElementById(
            "events-list"
        ) ||
        document.getElementById(
            "events-grid"
        );

    if (!container) return;

    container.innerHTML =
        events
            .map(
                event => `
                <div class="event-card">

                    <div class="event-date">
                        <strong>
                            ${formatDate(event.date)}
                        </strong>
                    </div>

                    <div class="event-content">

                        <span class="event-category">
                            ${escapeHTML(
                                event.category ||
                                "Event"
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(
                                event.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                event.description ||
                                ""
                            )}
                        </p>

                        <div class="event-meta">
                            <span>
                                🕐 ${escapeHTML(
                                    event.time || ""
                                )}
                            </span>

                            <span>
                                📍 ${escapeHTML(
                                    event.venue || ""
                                )}
                            </span>
                        </div>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const result =
        await api(
            "/announcements"
        );

    if (!result) return;

    announcements =
        result.data || [];

    const container =
        document.getElementById(
            "announcements-list"
        ) ||
        document.getElementById(
            "dashboard-announcements"
        );

    if (!container) return;

    container.innerHTML =
        announcements
            .map(
                item => `
                <div class="announcement-card">

                    <div class="announcement-icon">
                        ${
                            item.priority === "High"
                                ? "🚨"
                                : "📢"
                        }
                    </div>

                    <div>

                        <div class="announcement-top">
                            <strong>
                                ${escapeHTML(
                                    item.title
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    item.priority ||
                                    "Normal"
                                )}
                            </span>
                        </div>

                        <p>
                            ${escapeHTML(
                                item.message ||
                                ""
                            )}
                        </p>

                        <small>
                            ${escapeHTML(
                                item.date ||
                                ""
                            )}
                        </small>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// ACADEMICS
// ============================================================

function renderAcademics() {

    renderClassrooms();

    renderDepartments();

}


// ============================================================
// CLASSROOMS
// ============================================================

function renderClassrooms(
    list = classrooms
) {

    const container =
        document.getElementById(
            "classrooms-list"
        ) ||
        document.getElementById(
            "classroom-results"
        );

    if (!container) return;

    if (!list.length) {

        container.innerHTML = `
            <div class="empty-state">
                ❌ No classrooms found.
            </div>
        `;

        return;

    }

    container.innerHTML =
        list
            .map(
                item => `
                <div class="classroom-card">

                    <div class="classroom-icon">
                        🏫
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(item.code)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.building
                            )}
                            • Floor
                            ${escapeHTML(item.floor)}
                        </p>

                        <p>
                            🎓 ${escapeHTML(
                                item.section
                            )}
                        </p>

                        <small>
                            👥 Capacity:
                            ${escapeHTML(
                                item.capacity
                            )}
                            •
                            ${escapeHTML(
                                item.type
                            )}
                        </small>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// SEARCH CLASSROOM
// ============================================================

async function searchClassrooms() {

    const input =
        document.getElementById(
            "classroom-search"
        );

    if (!input) return;

    const query =
        input.value.trim();

    if (!query) {

        renderClassrooms();

        return;

    }

    const result =
        await api(
            "/classrooms?search=" +
            encodeURIComponent(query)
        );

    if (!result) return;

    renderClassrooms(
        result.data || []
    );

}


// ============================================================
// DEPARTMENTS
// ============================================================

function renderDepartments() {

    const container =
        document.getElementById(
            "departments-list"
        ) ||
        document.getElementById(
            "departments-grid"
        );

    if (!container) return;

    container.innerHTML =
        departments
            .map(
                dept => `
                <div class="department-card">

                    <div class="department-icon">
                        🎓
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                dept.name
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                dept.shortName
                            )}
                        </p>

                        <small>
                            📍 ${escapeHTML(
                                dept.building
                            )}
                            • Floor
                            ${escapeHTML(
                                dept.floor
                            )}
                        </small>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// AI
// ============================================================

function setupAI() {

    const input =
        document.getElementById(
            "ai-input"
        );

    if (!input) return;

    if (
        input.dataset.ready === "true"
    ) return;

    input.dataset.ready =
        "true";

    input.addEventListener(
        "keydown",
        handleAIKey
    );

}


function handleAIKey(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendAIMessage();

    }

}


async function sendAIMessage() {

    const input =
        document.getElementById(
            "ai-input"
        );

    if (!input) return;

    const message =
        input.value.trim();

    if (!message) return;

    addUserMessage(message);

    input.value = "";

    const typingId =
        addTypingMessage();

    const result =
        await api(
            "/ai/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        message
                    })
            }
        );

    removeTypingMessage(
        typingId
    );

    if (!result) {

        addAIMessage(
            "❌ I couldn't connect to the Campus AI service."
        );

        return;

    }

    const data =
        result.data || {};

    addAIMessage(
        data.reply ||
        "🤖 No response generated."
    );

    if (
        Array.isArray(
            data.suggestions
        )
    ) {

        addAISuggestions(
            data.suggestions
        );

    }

}


function askAI(message) {

    const input =
        document.getElementById(
            "ai-input"
        );

    if (!input) return;

    input.value =
        message;

    sendAIMessage();

}


// ============================================================
// CHAT
// ============================================================

function getAIChatContainer() {

    const ids = [
        "chat-messages",
        "ai-chat",
        "ai-messages",
        "chat-container"
    ];

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element)
            return element;

    }

    return null;

}


function addUserMessage(message) {

    const container =
        getAIChatContainer();

    if (!container) return;

    const element =
        document.createElement("div");

    element.className =
        "chat-message user-message";

    element.innerHTML = `
        <div class="message-avatar">
            👤
        </div>

        <div class="message-content">
            <div class="message-bubble">
                ${escapeHTML(message)}
            </div>
        </div>
    `;

    container.appendChild(element);

    scrollAIChat();

}


function addAIMessage(message) {

    const container =
        getAIChatContainer();

    if (!container) return;

    const element =
        document.createElement("div");

    element.className =
        "chat-message ai-message";

    element.innerHTML = `
        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">
            <div class="message-bubble">
                ${formatAIText(message)}
            </div>
        </div>
    `;

    container.appendChild(element);

    scrollAIChat();

}


function addTypingMessage() {

    const container =
        getAIChatContainer();

    if (!container) return null;

    const id =
        `typing-${Date.now()}`;

    const element =
        document.createElement("div");

    element.id = id;

    element.className =
        "chat-message ai-message";

    element.innerHTML = `
        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">
            <div class="message-bubble typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    container.appendChild(element);

    scrollAIChat();

    return id;

}


function removeTypingMessage(id) {

    if (!id) return;

    const element =
        document.getElementById(id);

    if (element)
        element.remove();

}


function addAISuggestions(
    suggestions
) {

    const container =
        getAIChatContainer();

    if (!container) return;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "ai-suggestions";

    suggestions.forEach(
        suggestion => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "suggestion-btn";

            button.textContent =
                suggestion;

            button.onclick =
                () =>
                    askAI(suggestion);

            wrapper.appendChild(
                button
            );

        }
    );

    container.appendChild(
        wrapper
    );

    scrollAIChat();

}


function scrollAIChat() {

    const container =
        getAIChatContainer();

    if (!container) return;

    setTimeout(
        () => {
            container.scrollTop =
                container.scrollHeight;
        },
        50
    );

}


function formatAIText(text) {

    return escapeHTML(
        String(text)
    )
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /\n/g,
            "<br>"
        );

}


// ============================================================
// GLOBAL SEARCH
// ============================================================

function setupGlobalSearch() {

    const input =
        document.getElementById(
            "global-search"
        );

    if (!input) return;

    if (
        input.dataset.ready === "true"
    ) return;

    input.dataset.ready =
        "true";

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                performGlobalSearch(
                    input.value
                );

            }

        }
    );

}


async function performGlobalSearch(
    query
) {

    query =
        String(query || "")
            .trim();

    if (!query) return;

    const result =
        await api(
            "/search?q=" +
            encodeURIComponent(query)
        );

    if (!result) return;

    const results =
        result.data || [];

    showSearchResults(
        results,
        query
    );

}


function showSearchResults(
    results,
    query
) {

    const old =
        document.getElementById(
            "global-search-results"
        );

    if (old)
        old.remove();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "global-search-results";

    panel.className =
        "search-results-panel";

    panel.innerHTML = `
        <div class="search-results-header">

            <strong>
                🔎 Results for "${escapeHTML(query)}"
            </strong>

            <button
                onclick="
                    this.closest(
                        '.search-results-panel'
                    ).remove()
                "
            >
                ✕
            </button>

        </div>

        <div class="search-results-body">

            ${
                results.length
                    ? results.map(
                        item => `
                        <div
                            class="search-result-item"
                            onclick="
                                handleSearchResult(
                                    '${escapeAttribute(
                                        item.type
                                    )}',
                                    '${escapeAttribute(
                                        item.title
                                    )}'
                                )
                            "
                        >
                            <span class="result-type">
                                ${escapeHTML(
                                    item.type
                                )}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    item.title
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    item.description ||
                                    ""
                                )}
                            </small>
                        </div>
                        `
                    ).join("")
                    : `
                        <div class="empty-state">
                            ❌ No results found.
                        </div>
                    `
            }

        </div>
    `;

    document.body.appendChild(
        panel
    );

}


function handleSearchResult(
    type,
    title
) {

    if (type === "Building") {

        showPage("map");

        openLocation(title);

    }

    else if (type === "Classroom") {

        showPage("academics");

        const input =
            document.getElementById(
                "classroom-search"
            );

        if (input) {

            input.value =
                title;

            searchClassrooms();

        }

    }

    else if (type === "Food") {

        showPage("food");

    }

    else if (type === "Event") {

        showPage("events");

    }

    else if (type === "Department") {

        showPage("academics");

    }

}


// ============================================================
// COMPLAINTS
// ============================================================

function setupComplaintForm() {

    const form =
        document.getElementById(
            "complaint-form"
        );

    if (!form) return;

    if (
        form.dataset.ready === "true"
    ) return;

    form.dataset.ready =
        "true";

    form.addEventListener(
        "submit",
        submitComplaint
    );

}


async function submitComplaint(event) {

    event.preventDefault();

    const form =
        event.target;

    const formData =
        new FormData(form);

    const payload = {

        title:
            formData.get("title") ||
            getValue("complaint-title"),

        category:
            formData.get("category") ||
            getValue("complaint-category") ||
            "General",

        description:
            formData.get("description") ||
            getValue("complaint-description"),

        location:
            formData.get("location") ||
            getValue("complaint-location") ||
            "Not specified",

        priority:
            formData.get("priority") ||
            getValue("complaint-priority") ||
            "Medium"

    };

    if (
        !payload.title ||
        !payload.description
    ) {

        showToast(
            "Title and description are required",
            "error"
        );

        return;

    }

    const result =
        await api(
            "/complaints",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(payload)
            }
        );

    if (!result) return;

    showToast(
        `Complaint ${result.data?.id || ""} submitted successfully`,
        "success"
    );

    form.reset();

    loadComplaints();

}


async function loadComplaints() {

    const result =
        await api(
            "/complaints"
        );

    if (!result) return;

    complaints =
        result.data || [];

    const container =
        document.getElementById(
            "complaints-list"
        ) ||
        document.getElementById(
            "recent-complaints"
        );

    if (!container) return;

    if (!complaints.length) {

        container.innerHTML = `
            <div class="empty-state">
                🎫 No complaints submitted yet.
            </div>
        `;

        return;

    }

    container.innerHTML =
        complaints
            .slice()
            .reverse()
            .map(
                item => `
                <div class="complaint-card">

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.title
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                item.description
                            )}
                        </p>

                        <small>
                            🎫 ${escapeHTML(
                                item.id
                            )}
                            •
                            ${escapeHTML(
                                item.status
                            )}
                            •
                            ${escapeHTML(
                                item.priority
                            )}
                        </small>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// EMERGENCY
// ============================================================

async function loadEmergency() {

    const result =
        await api(
            "/emergency"
        );

    if (!result) return;

    const container =
        document.getElementById(
            "emergency-list"
        ) ||
        document.getElementById(
            "emergency-grid"
        );

    if (!container) return;

    container.innerHTML =
        (result.data || [])
            .map(
                item => `
                <div class="emergency-card">

                    <div class="emergency-icon">
                        🚨
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.service
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.description ||
                                ""
                            )}
                        </p>

                        <strong>
                            📞 ${escapeHTML(
                                item.contact
                            )}
                        </strong>

                    </div>

                </div>
                `
            )
            .join("");

}


// ============================================================
// THEME
// ============================================================

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const dark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "campus-theme",
        dark ? "dark" : "light"
    );

    updateThemeButtons();

}


function loadTheme() {

    if (
        localStorage.getItem(
            "campus-theme"
        ) === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }

    updateThemeButtons();

}


function updateThemeButtons() {

    const dark =
        document.body.classList.contains(
            "dark-mode"
        );

    document
        .querySelectorAll(
            "[data-theme-toggle]"
        )
        .forEach(
            button =>
                button.textContent =
                    dark ? "☀️" : "🌙"
        );

}


// ============================================================
// MOBILE
// ============================================================

function toggleMobileNav() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) return;

    sidebar.classList.toggle(
        "mobile-open"
    );

}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "toast-container"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "toast-container";

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(
        toast
    );

    setTimeout(
        () => {

            toast.classList.add(
                "hide"
            );

            setTimeout(
                () => toast.remove(),
                300
            );

        },
        3000
    );

}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element)
        element.textContent =
            value;

}


function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value
        : "";

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            "&quot;"
        );

}


function formatDate(
    dateString
) {

    if (!dateString)
        return "";

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    )
        return dateString;

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.showPage =
    showPage;

window.askAI =
    askAI;

window.sendAIMessage =
    sendAIMessage;

window.handleAIKey =
    handleAIKey;

window.toggleTheme =
    toggleTheme;

window.toggleMobileNav =
    toggleMobileNav;

window.searchClassrooms =
    searchClassrooms;

window.performGlobalSearch =
    performGlobalSearch;

window.findLocation =
    findLocation;

window.submitComplaint =
    submitComplaint;

window.openLocation =
    openLocation;

window.handleSearchResult =
    handleSearchResult;

console.log(
    "🤖 Campus Helper AI v2 frontend ready!"
);