# Tseer Platform Specification

## Overview
Tseer is a 3-month advisory pilot program that connects African startup founders with Diaspora experts for mentorship and growth acceleration.

## How Tseer Should Work: Step-by-Step Process

### Phase 1: Application & Registration

#### Step 1: Landing Page Experience
Users visit the homepage (/) which presents two distinct paths:
- "Apply as Founder" - for Africa-based startup founders
- "Apply as Advisor" - for Diaspora experts worldwide

#### Step 2: Founder Application Process
Founders fill out a comprehensive application including:
- Personal details (name, email, location)
- Startup information (name, website, sector, stage)
- Current challenges and goals
- Success definition ("win definition")
- Optional video pitch
- Consent for case study participation

Application gets stored in `base_applications` and `founder_application_details` tables

#### Step 3: Advisor Application Process
Advisors complete their application with:
- Professional background (LinkedIn, experience level)
- Areas of expertise (marketing, product, finance, etc.)
- Timezone and availability
- Challenge preferences (what type of problems they want to solve)
- Consent for public profile visibility

Application gets stored in `base_applications` and `advisor_application_details` tables

### Phase 2: Review & Approval

#### Step 4: Admin Review Process
Admin users access the Admin Dashboard (/admin-dashboard)
Review all pending applications in the Application Review section
Evaluate applications based on:
- Founder readiness and coachability
- Advisor expertise and experience
- Fit with program goals
- Approve or reject applications with detailed feedback

#### Step 5: User Account Creation
Upon approval, the system automatically:
- Creates user accounts in the `users` table
- Sets up user profiles in `user_profiles` table
- Creates role-specific profiles (`founder_profiles` or `advisor_profiles`)
- Sends welcome notifications
- Grants access to the platform

### Phase 3: Matching & Assignment

#### Step 6: Manual Matching Process
Admin users use the Matching Dashboard to:
- View all approved founders and advisors
- Analyze compatibility using the matching algorithm that considers:
  - Sector alignment
  - Experience level compatibility
  - Timezone overlap
  - Challenge type matching
  - Geographic considerations
- Create assignments in `advisor_founder_assignments` table (1 advisor : 1 founder)

#### Step 7: Assignment Notification
- Both parties receive notifications about their assignment
- Initial briefing materials are shared
- Orientation calls are scheduled

### Phase 4: Advisory Relationship

#### Step 8: Founder Dashboard Experience
Founders access their dashboard (/founder-dashboard) to:
- View their assigned advisor details
- Track session history and upcoming meetings
- Set and monitor goals with their advisor
- Access resources and materials
- Submit session feedback

#### Step 9: Advisor Dashboard Experience
Advisors access their dashboard (/advisor-dashboard) to:
- View their assigned founder(s) details
- Prepare for sessions with founder briefings
- Schedule and manage advisory sessions
- Track founder progress and goals
- Access preparation materials

#### Step 10: Session Management
Advisory sessions are managed through:
- Session proposals and scheduling
- Meeting link generation (virtual meetings)
- Session notes and outcome tracking
- Post-session feedback collection
- AI-powered session analysis for insights

### Phase 5: Goal Tracking & Progress

#### Step 11: Goal Setting & Monitoring
- Collaborative goal setting between advisor and founder
- Milestone tracking with progress percentages
- Regular check-ins and progress updates
- Adjustments based on session outcomes

#### Step 12: Resource Access
- Shared resource library (/resources)
- Access to micro-masterclasses
- Case study materials and templates
- Best practice guides

### Phase 6: Program Completion

#### Step 13: Final Outcomes
- Completion of 3 advisory sessions
- Written growth plan creation
- Final case study documentation
- Program feedback and testimonials
- Alumni network access

## Key Technical Components

### Authentication & Security
- Role-based access control (founder/advisor/admin)
- Secure user authentication via Supabase Auth
- Row-level security policies protecting user data

### Data Architecture
- Applications: `base_applications` → role-specific details tables
- Users: `users` → `user_profiles` → role-specific profiles
- Assignments: `advisor_founder_assignments` (1:1 matching)
- Sessions: `sessions` with feedback, analysis, and reminders
- Goals: `goals` with `goal_milestones` for tracking progress

### Matching Algorithm
- Considers multiple factors for optimal advisor-founder pairing
- Scoring system based on sector, experience, timezone, challenges
- Manual override capability for admin fine-tuning

### Communication System
- In-app messaging between assigned pairs
- Notification system for important updates
- Email integration for external communication

## Current Implementation Status

The platform has the core infrastructure in place but needs:

### Priority Improvements Needed

1. **Complete the User Journey Flow**
   - Test the complete application → approval → assignment → session workflow
   - Ensure data flows correctly between all components
   - Ensure matching follows the way it should
   - Validate that all user roles see appropriate information

2. **Enhance Session Management**
   - Complete session scheduling and management workflow
   - Implement session feedback collection
   - Add session analytics and insights
   - Ensure proper session state management

3. **Fix Data Flow Issues**
   - Verify all database relationships work correctly
   - Ensure proper data propagation between tables
   - Fix any broken queries or data access patterns

4. **Improve Matching System**
   - Refine the matching algorithm implementation
   - Ensure proper scoring and ranking
   - Test manual assignment capabilities

5. **Complete Notification System**
   - Implement real-time notifications
   - Set up email notification workflows
   - Add notification preferences management

6. **Resource Management**
   - Complete resource library functionality
   - Implement file upload and management
   - Add resource categorization and search

## Success Metrics

The platform should enable:
- Seamless application and approval process
- Effective advisor-founder matching
- Productive advisory sessions
- Clear goal tracking and progress monitoring
- Valuable resource access
- Successful program completion with measurable outcomes

## Next Steps

1. Implement end-to-end user journey testing
2. Complete session management workflow
3. Enhance matching algorithm accuracy
4. Activate notification systems
5. Finalize resource management features
6. Conduct pilot program testing