# Eventila – The Heartbeat of Your Campus

**Connecting Colleges Through Events**

Eventila is a smart campus event management platform designed to simplify how students discover events, how faculty manage them, and how college management supervises event activities. It provides a centralized platform for event discovery, registration, approvals, and coordination.

## 1. Chosen Vertical

**Education – Campus Event Management**

Eventila focuses on improving the campus event ecosystem by connecting students, faculty members, and college management through a unified digital platform.

It addresses common challenges such as:
- Difficulty discovering events happening across colleges.
- Manual event registration and coordination.
- Lack of a structured event approval process.
- Limited visibility into event participation and management.

## 2. Approach and Logic

Eventila follows a role-based architecture where each user gets access to features according to their role.

### Role-Based Access Control

- **Students:** Discover events, register for events, and manage their participation.
- **Faculty:** Create and manage events and submit them for approval.
- **HOD / Management:** Review event requests, approve or reject submissions, and supervise event activities.
- **Guests:** Explore publicly available events and register without creating an account.

### Event Approval Workflow

1. Faculty members create an event with the required details.
2. The event is submitted for approval.
3. HOD or management reviews the submission.
4. Approved events become available to the intended audience.
5. Students and guests can register according to the event's access settings.

### Authentication and Security

- Supabase Authentication handles user authentication.
- Role-based permissions control access to application features.
- Supabase Row Level Security (RLS) helps protect database records.
- Guest access is separated from authenticated user dashboards.

## 3. How the Solution Works

Eventila provides an end-to-end event management experience.

**Step 1 – User Access**

Users can sign up and log in according to their roles. Guests can directly access publicly available events without logging in.

**Step 2 – Event Creation**

Faculty members can create events by providing details such as event title, description, date, venue, category, and other relevant information.

**Step 3 – Event Approval**

Submitted events follow a structured approval process managed by the appropriate college authorities.

**Step 4 – Event Discovery**

Students can explore approved events through a centralized interface. Public events can also be discovered by guests.

**Step 5 – Registration**

Students can register using their accounts, while guests can register by providing the required personal and contact details.

**Step 6 – Management**

Role-specific dashboards help users manage events, registrations, approvals, and notifications.

## 4. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend / Database | Supabase |
| Authentication | Supabase Auth |
| Database Security | Supabase RLS |
| Development Platform | Google AI Studio |
| Version Control | GitHub |
| Deployment | Vercel |

## 5. Assumptions Made

The solution is designed based on the following assumptions:

1. Each registered user belongs to a college and has an assigned role.
2. Faculty members are authorized to submit event proposals.
3. HOD or management users are responsible for reviewing and approving event submissions.
4. Only approved events should be publicly discoverable or available to their intended audience.
5. Guest users are allowed to browse public events and register without creating an account.
6. Internal college events may have restricted visibility based on user roles and college association.
7. Users must have an internet connection to access the cloud-based application.
8. College administrators are responsible for maintaining accurate user roles and institutional information.

## 6. Expected Impact

Eventila aims to:

- Simplify campus event discovery and registration.
- Reduce manual coordination and administrative effort.
- Improve communication between students, faculty, and management.
- Provide a structured and transparent event approval workflow.
- Encourage collaboration and participation across colleges.

## 7. Project Links

- **GitHub Repository:** https://github.com/Aravinth-git-hub/eventila-campus-events
- **Live Application:** [https://eventila-campus-events-1nun.vercel.app/]

---

**Eventila – Bringing Campus Communities Together Through Events.**
