#!/bin/bash
# Run this ONCE on your computer to set all Vercel env vars
# Requirements: vercel CLI installed (npm i -g vercel) and logged in (vercel login)

echo "🔧 Setting Vercel environment variables for Massai Chat..."
echo ""
echo "Paste your values when prompted:"

read -p "GEMINI_API_KEY (starts with AIza): " GEMINI_KEY
read -p "GROQ_API_KEY (starts with gsk_): " GROQ_KEY

PROJECT="ai"
TEAM="dakshxd1s-projects"

SUPABASE_URL="https://xsiutzwucvtsuwxkphvx.supabase.co"
SUPABASE_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaXV0end1Y3Z0c3V3eGtwaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjQ2NzAsImV4cCI6MjA4NzMwMDY3MH0.JyewYB-_e-j55Wmg14wZdsxfPB3v6yU1ZThXfiZwMjI"

# Add to all environments (production, preview, development)
for ENV in production preview development; do
  echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL $ENV --scope $TEAM --project $PROJECT -y 2>/dev/null
  echo "$SUPABASE_ANON" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY $ENV --scope $TEAM --project $PROJECT -y 2>/dev/null
  echo "$GEMINI_KEY" | vercel env add GEMINI_API_KEY $ENV --scope $TEAM --project $PROJECT -y 2>/dev/null
  echo "$GROQ_KEY" | vercel env add GROQ_API_KEY $ENV --scope $TEAM --project $PROJECT -y 2>/dev/null
done

echo ""
echo "✅ All env vars set! Now redeploy:"
echo "   vercel --prod --scope $TEAM --project $PROJECT"
