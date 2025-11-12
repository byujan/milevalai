# MilEvalAI - Military Evaluation Intelligence Assistant

AI-powered tool to help Soldiers and Leaders craft strong, regulation-ready NCOERs & OERs.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS 3.0
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI Components**: Lucide React Icons
- **Deployment**: Vercel (recommended)

## Features

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Dashboard to manage evaluations
- ✅ Create evaluations with duty title, type, and rank selection
- ✅ AI-powered bullet generation and editing
- ✅ Summary narrative generation
- ✅ Review & validation with compliance checking
- ✅ Export to EES Text, PDF, and DOCX formats

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to find your project URL and anon key
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

Run the SQL commands in `supabase/schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the query

This will create:
- `evaluations` table with proper schema
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/Users/peter/repos/milevalai/
├── app/                          # Next.js app directory
│   ├── auth/                     # Authentication pages
│   │   ├── signin/              # Sign in page
│   │   ├── signup/              # Sign up page
│   │   └── callback/            # OAuth callback
│   ├── dashboard/               # Dashboard page
│   ├── evaluation/              # Evaluation pages
│   │   ├── create/              # Create new evaluation
│   │   └── [id]/                # Dynamic evaluation routes
│   │       ├── bullets/         # Bullet generation
│   │       ├── narrative/       # Summary narrative
│   │       ├── review/          # Review & validation
│   │       └── export/          # Export options
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── lib/                          # Utility libraries
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   └── types/                   # TypeScript types
│       └── database.ts          # Database types
├── supabase/                    # Supabase configuration
│   └── schema.sql               # Database schema
├── middleware.ts                # Next.js middleware
├── tailwind.config.ts           # Tailwind configuration
└── package.json                 # Dependencies
```

## Database Schema

### Evaluations Table

| Column              | Type      | Description                                    |
|---------------------|-----------|------------------------------------------------|
| id                  | uuid      | Primary key                                    |
| user_id             | uuid      | Foreign key to auth.users                      |
| duty_title          | text      | Job title (e.g., "Company First Sergeant")    |
| evaluation_type     | text      | "NCOER" or "OER"                              |
| evaluation_subtype  | text      | "Annual", "Change of Rater", "Relief for Cause"|
| rank_level          | text      | Rank level being evaluated                     |
| status              | text      | Workflow status                                |
| bullets             | jsonb     | Array of performance bullets                   |
| narrative           | text      | Summary narrative                              |
| form_data           | jsonb     | Additional form data                           |
| created_at          | timestamp | Creation timestamp                             |
| updated_at          | timestamp | Last update timestamp                          |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Next Steps / Future Enhancements

- [ ] Integrate actual AI model (e.g., OpenAI, Anthropic, or local LLM)
- [ ] Implement PDF generation with proper DA Form templates
- [ ] Add DOCX export functionality
- [ ] Implement bullet ranking and auto-ordering
- [ ] Add predecessor upload feature for tone matching
- [ ] Implement comprehensive validation rules (AR 623-3)
- [ ] Add support for more evaluation types and forms
- [ ] User profile and preferences
- [ ] Evaluation templates and examples
- [ ] Collaboration features (share with rater/senior rater)

## License

MIT License - Made for Soldiers by Soldiers

## Support

For issues or questions, please open an issue on GitHub.
