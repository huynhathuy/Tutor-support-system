**Add your own guidelines here**

1. Revised Scope for 3-Day MVP
To meet the deadline, your scope must shift from "Building a System" to "Building a Demo Platform".

Architecture Shift
Database: None. Use JSON files (tutors.json, bookings.json, users.json) or simple in-memory JavaScript/Python arrays/objects.

Authentication: Mock only. No JWT encryption or secure password hashing. Check against a hardcoded list of users.

Integrations (SSO, DataCore): Completely faked. The "Login" button should just direct the user to the dashboard if the username matches a list.

Backend Tech Stack Recommendation
Option A (Fastest - Node.js): Use json-server. It automatically creates a full REST API from a single .json file. It supports GET, POST, PUT, DELETE, and filtering out of the box.

Setup time: 30 minutes.

Option B (Flexible - Node/Express or Python/FastAPI): Build a simple server where variables let tutors = [...] act as your database.

Setup time: 2-3 hours.

2. 3-Day Development Plan
This schedule assumes you have the UI mostly ready (as implied by your uploads) and just need to wire it up.

Day 1: The "Mock" Foundation & Read APIs
Morning (08:00 - 12:00): Data Structure mirroring.

Take your frontend TypeScript interfaces (e.g., from types/tutor.ts or data/mockTutors.ts) and convert them into JSON files (e.g., db.json).

Create users.json with the demo accounts listed in Login.tsx (student1/pass123, etc.).

Afternoon (13:00 - 17:00): Server Setup.

Initialize the project (e.g., npm init, npm install express cors body-parser).

Create the GET endpoints: /tutors, /users/me, /classes.

Goal: Ensure the UI can fetch and display lists of data from the server instead of local mock files.

Evening (18:00 - 21:00): Auth Bypass.

Implement /login. It should simply accept {username, password}, check if it exists in users.json, and return { token: "fake-token", user: {...} }.

Update the frontend AuthContext to store this fake user/token.

Day 2: Write Operations & Interactions
Morning (08:00 - 12:00): Booking Logic.

Implement POST /bookings.

Logic: Read bookings.json, push the new booking object, write back to file.

Update tutors.json availability status if necessary.

Afternoon (13:00 - 17:00): Tutor Dashboard.

Implement POST /sessions (for Tutors creating classes).

Implement PATCH /bookings/{id} (for Tutors accepting/rejecting students).

Evening (18:00 - 21:00): CTSV Features.

Create a static endpoint GET /risk-assessment that returns the hardcoded list of "At-Risk" students you defined in RiskListTable.tsx.

Don't write an algorithm. Just return the JSON.

Day 3: Integration & Polish
Morning (08:00 - 12:00): Wiring.

Replace all fetch or axios calls in the React frontend to point to http://localhost:3000/api/....

Handle CORS issues (allow localhost:5173 or whatever your Vite port is).

Afternoon (13:00 - 17:00): Demo Prep.


Crucial: The project requires a "working demonstration (by sequence of screens)".

Walk through the "Happy Path" (Login -> Book -> Tutor Accept). If a bug appears, fix only that path.


Evening: Record the demo or practice the presentation.

3. Areas to Adjust Expectations
To succeed in 3 days, you must aggressively cut these features:

Real-Time Data: Do not use WebSockets (Socket.io) for notifications. Just have the user refresh the page to see "Accepted" status.


File Uploads: In TutorClassDetail, for material uploads, just accept the request on the backend and return "Success" without actually saving the file to disk.

Complex Searching: For the search bar, handle it on the Frontend. Fetch all tutors from the backend and filter them in React. It's faster to implement and acceptable for an MVP.

Risk Algorithms: Do not calculate risk scores dynamically. Hardcode specific students (e.g., "Student A has low attendance") in your JSON file to demonstrate the concept to the professors.

Summary
Using hardcoded JSON files serves the requirement  perfectly and turns a 2-week backend task into a 3-day task. Focus entirely on the data flow (User clicks -> Data saves -> User sees update) rather than engineering perfection.

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
